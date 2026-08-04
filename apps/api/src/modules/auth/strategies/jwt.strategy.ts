import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { EnvSchema } from '../../../common/config/env.validation';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import type { AccessTokenPayload } from '../token.service';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';

const USER_CACHE_TTL_SECONDS = 60;

function extractFromCookie(req: Request): string | null {
  return (req.cookies?.['access_token'] as string | undefined) ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<EnvSchema, true>,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), extractFromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<RequestUser> {
    const cacheKey = `user:${payload.sub}`;
    const cached = await this.redis.getJson<RequestUser & { isSuspended: boolean }>(cacheKey);
    const record =
      cached ??
      (await this.prisma.user
        .findUnique({ where: { id: payload.sub } })
        .then((u) => u && { id: u.id, email: u.email, role: u.role, isSuspended: u.isSuspended }));

    if (!record) throw new UnauthorizedException('User no longer exists');
    if (record.isSuspended) throw new UnauthorizedException('Account suspended');
    if (!cached) await this.redis.setJson(cacheKey, record, USER_CACHE_TTL_SECONDS);

    return { id: record.id, email: record.email, role: record.role };
  }
}
