import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  limit: number;
  ttlSeconds: number;
}

/** Overrides the default per-route rate limit applied by RateLimitGuard. */
export const RateLimit = (options: RateLimitOptions): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_KEY, options);

export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';
export const SkipRateLimit = (): MethodDecorator & ClassDecorator => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
