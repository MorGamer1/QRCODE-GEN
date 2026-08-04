import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import type { User } from '@prisma/client';
import type { EnvSchema } from '../../common/config/env.validation';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly prisma: PrismaService,
  ) {}

  signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): { token: string; ttlMs: number } {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    const ttl = this.config.get('JWT_ACCESS_TTL', { infer: true });
    const token = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: ttl,
    });
    return { token, ttlMs: parseDurationMs(ttl) };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Issues a brand-new session (used at login/register/OAuth). */
  async issueSession(
    user: Pick<User, 'id' | 'email' | 'role'>,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<IssuedTokens> {
    const { token: accessToken, ttlMs: accessTokenTtlMs } = this.signAccessToken(user);

    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenTtlMs,
      refreshTokenTtlMs: ttlDays * 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Rotates a refresh token: the presented token is atomically revoked and replaced.
   * Returns null if the token is unknown, expired or already revoked (including reuse
   * of an already-rotated token, which likely indicates theft).
   */
  async rotateSession(
    presentedRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<IssuedTokens | null> {
    const hash = this.hashRefreshToken(presentedRefreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.isSuspended) return null;

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(user, meta);
  }

  async revokeSessionByRefreshToken(presentedRefreshToken: string): Promise<void> {
    const hash = this.hashRefreshToken(presentedRefreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

/** Parses jwt-style durations ("15m", "30d", "1h") into milliseconds for cookie maxAge. */
export function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2] as 's' | 'm' | 'h' | 'd'
  ];
  return value * unitMs;
}
