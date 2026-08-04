import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT } from '@qrgen/shared';
import type { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions, SKIP_RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Redis-backed fixed-window rate limiter. Applied globally as a default
 * (RATE_LIMIT.API_DEFAULT from @qrgen/shared) with per-route overrides via
 * @RateLimit(). Keys by user id when authenticated, falling back to IP, so
 * limits track "who", not just "where", for API-key/JWT authenticated calls.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { limit: RATE_LIMIT.API_DEFAULT.limit, ttlSeconds: RATE_LIMIT.API_DEFAULT.ttlSeconds };

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const identifier = request.user?.id ?? request.ip ?? 'anonymous';
    const routeKey = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `ratelimit:${routeKey}:${identifier}`;

    const count = await this.redis.incrWithExpiry(key, options.ttlSeconds);
    if (count > options.limit) {
      throw new HttpException('Too many requests, please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
