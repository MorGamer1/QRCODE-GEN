import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedirectCacheService, type CachedRedirectEntry } from '../../common/redirect-cache/redirect-cache.service';
import { PasswordService } from '../auth/password.service';
import { SCAN_EVENTS_QUEUE, type ScanEventJob } from '../../common/queue/queue.constants';

export type AvailabilityResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'expired' | 'not-yet-active' | 'deactivated' | 'scan-limit' };

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedirectCacheService,
    private readonly passwords: PasswordService,
    @InjectQueue(SCAN_EVENTS_QUEUE) private readonly scanQueue: Queue<ScanEventJob>,
  ) {}

  async resolve(shortCode: string): Promise<CachedRedirectEntry | null> {
    const cached = await this.cache.get(shortCode);
    if (cached) return cached;

    const qr = await this.prisma.qrCode.findUnique({
      where: { shortCode },
      include: { redirectRules: { where: { isActive: true }, orderBy: { priority: 'asc' } } },
    });
    if (!qr || qr.type !== 'DYNAMIC') return null;

    await this.cache.set(qr);
    return qr;
  }

  checkAvailability(entry: CachedRedirectEntry): AvailabilityResult {
    const now = new Date();
    if (entry.expiresAt && new Date(entry.expiresAt) < now) return { ok: false, reason: 'expired' };
    if (entry.activateAt && new Date(entry.activateAt) > now) return { ok: false, reason: 'not-yet-active' };
    if (entry.deactivateAt && new Date(entry.deactivateAt) < now) return { ok: false, reason: 'deactivated' };
    if (entry.scanLimit !== null && entry.totalScans >= entry.scanLimit) return { ok: false, reason: 'scan-limit' };
    return { ok: true };
  }

  verifyPassword(entry: CachedRedirectEntry, plain: string): Promise<boolean> {
    if (!entry.passwordHash) return Promise.resolve(true);
    return this.passwords.verify(entry.passwordHash, plain);
  }

  /** Fire-and-forget: never let analytics recording add latency to the redirect response. */
  enqueueScan(job: ScanEventJob): void {
    this.scanQueue.add('scan', job).catch((error: Error) => {
      this.logger.error(`Failed to enqueue scan event: ${error.message}`);
    });
  }
}
