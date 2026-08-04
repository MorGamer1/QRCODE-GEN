import { Injectable } from '@nestjs/common';
import type { QrCode, RedirectRule } from '@prisma/client';
import { RedisService } from '../redis/redis.service';

/** Everything the redirect controller needs to resolve a scan without a DB round trip. */
export interface CachedRedirectEntry extends QrCode {
  redirectRules: RedirectRule[];
}

const TTL_SECONDS = 60;

function key(shortCode: string): string {
  return `redirect:${shortCode}`;
}

/**
 * Cache-aside layer shared by the QR codes module (which invalidates on
 * write) and the redirect module (which reads on every scan). A short TTL
 * keeps scan-limit/expiry checks reasonably fresh without pinning every
 * redirect to a synchronous Postgres read - see docs/ARCHITECTURE.md for the
 * consistency trade-off this implies for scan-limit enforcement.
 */
@Injectable()
export class RedirectCacheService {
  constructor(private readonly redis: RedisService) {}

  get(shortCode: string): Promise<CachedRedirectEntry | null> {
    return this.redis.getJson<CachedRedirectEntry>(key(shortCode));
  }

  set(entry: CachedRedirectEntry): Promise<void> {
    return this.redis.setJson(key(entry.shortCode!), entry, TTL_SECONDS);
  }

  async invalidate(shortCode: string | null | undefined): Promise<void> {
    if (!shortCode) return;
    await this.redis.del(key(shortCode));
  }
}
