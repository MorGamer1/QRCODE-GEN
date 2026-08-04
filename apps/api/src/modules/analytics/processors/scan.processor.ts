import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { SettingsService } from '../../../common/settings/settings.service';
import { SCAN_EVENTS_QUEUE, type ScanEventJob } from '../../../common/queue/queue.constants';

const UNIQUE_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Consumes scan events enqueued by the redirect controller. Deliberately does
 * all the "slow" work here (geoip, UA parsing, uniqueness dedup, three
 * separate writes) so the public redirect response never waits on it.
 */
@Processor(SCAN_EVENTS_QUEUE, { concurrency: 10 })
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly settings: SettingsService,
  ) {
    super();
  }

  async process(job: Job<ScanEventJob>): Promise<void> {
    const data = job.data;
    const settings = await this.settings.get();
    const scannedAt = new Date(data.scannedAt);

    const ua = UAParser(data.userAgent);
    const deviceType = ua.device.type ?? 'desktop';
    const language = data.acceptLanguage?.split(',')[0]?.trim();

    let country: string | undefined;
    let region: string | undefined;
    let city: string | undefined;
    let latitude: number | undefined;
    let longitude: number | undefined;
    let timezone: string | undefined;
    let ipHash: string | undefined;

    if (settings.gdprStoreIp && data.ip) {
      const geo = geoip.lookup(data.ip);
      if (geo) {
        country = geo.country;
        region = geo.region;
        city = geo.city;
        latitude = geo.ll?.[0];
        longitude = geo.ll?.[1];
        timezone = geo.timezone;
      }
      if (settings.gdprHashIp) {
        ipHash = createHash('sha256').update(data.ip).digest('hex');
      }
    }

    const isUnique = await this.checkAndMarkUnique(data.qrCodeId, data.ip, data.userAgent);

    await this.prisma.scan.create({
      data: {
        qrCodeId: data.qrCodeId,
        scannedAt,
        isUnique,
        ipHash,
        country,
        region,
        city,
        latitude,
        longitude,
        deviceType,
        os: ua.os.name,
        osVersion: ua.os.version,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        language,
        referrer: data.referrer,
        userAgent: data.userAgent,
        timezone,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
      },
    });

    await this.prisma.qrCode.update({
      where: { id: data.qrCodeId },
      data: {
        totalScans: { increment: 1 },
        uniqueScans: isUnique ? { increment: 1 } : undefined,
        lastScannedAt: scannedAt,
      },
    });
    // Prisma can't express "set only if currently null" in one call; cheap follow-up, scan volume-appropriate.
    await this.prisma.qrCode.updateMany({
      where: { id: data.qrCodeId, firstScannedAt: null },
      data: { firstScannedAt: scannedAt },
    });

    const day = new Date(
      Date.UTC(scannedAt.getUTCFullYear(), scannedAt.getUTCMonth(), scannedAt.getUTCDate()),
    );
    await this.prisma.scanDailyStat.upsert({
      where: { qrCodeId_date: { qrCodeId: data.qrCodeId, date: day } },
      update: {
        totalScans: { increment: 1 },
        uniqueScans: isUnique ? { increment: 1 } : undefined,
      },
      create: { qrCodeId: data.qrCodeId, date: day, totalScans: 1, uniqueScans: isUnique ? 1 : 0 },
    });
  }

  /** Redis-backed dedup: same (qrCode, ip+UA fingerprint) within 24h counts as one unique visitor. */
  private async checkAndMarkUnique(
    qrCodeId: string,
    ip: string | undefined,
    userAgent: string | undefined,
  ): Promise<boolean> {
    const fingerprint = createHash('sha256')
      .update(`${ip ?? 'unknown'}:${userAgent ?? 'unknown'}`)
      .digest('hex');
    const key = `scan-fp:${qrCodeId}:${fingerprint}`;
    const result = await this.redis.client.set(key, '1', 'EX', UNIQUE_WINDOW_SECONDS, 'NX');
    return result === 'OK';
  }
}
