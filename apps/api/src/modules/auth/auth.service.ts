import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuditAction } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SettingsService } from '../../common/settings/settings.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import type { EnvSchema } from '../../common/config/env.validation';
import { PasswordService } from './password.service';
import { TokenService, type IssuedTokens } from './token.service';
import { TwoFactorService } from './two-factor.service';
import type { LoginDto, RegisterDto } from './dto';

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export type SafeUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

export type LoginResult =
  { status: 'ok'; user: SafeUser; tokens: IssuedTokens } | { status: 'twoFactorRequired' };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  private sanitize(user: User): SafeUser {
    const { passwordHash: _p, twoFactorSecret: _t, ...safe } = user;
    return safe;
  }

  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<{ user: SafeUser; tokens: IssuedTokens | null; requiresEmailVerification: boolean }> {
    const settings = await this.settings.get();
    if (!settings.allowPublicRegistration) {
      throw new ForbiddenException('Public registration is disabled on this server');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        emailVerified: !settings.requireEmailVerification,
      },
    });

    this.audit.record({
      userId: user.id,
      action: AuditAction.USER_REGISTER,
      ipAddress: meta.ipAddress,
    });
    await this.sendVerificationEmail(user);

    if (settings.requireEmailVerification) {
      return { user: this.sanitize(user), tokens: null, requiresEmailVerification: true };
    }
    const tokens = await this.tokens.issueSession(user, meta);
    return { user: this.sanitize(user), tokens, requiresEmailVerification: false };
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (
      !user ||
      !user.passwordHash ||
      !(await this.passwords.verify(user.passwordHash, dto.password))
    ) {
      this.audit.record({
        action: AuditAction.USER_LOGIN_FAILED,
        metadata: { email: dto.email },
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isSuspended) throw new ForbiddenException('This account has been suspended');

    const settings = await this.settings.get();
    if (settings.requireEmailVerification && !user.emailVerified) {
      throw new ForbiddenException('Please verify your email address before logging in');
    }

    if (user.twoFactorEnabled) {
      const verified =
        (dto.twoFactorCode &&
          user.twoFactorSecret &&
          this.twoFactor.verifyToken(dto.twoFactorCode, user.twoFactorSecret)) ||
        (dto.recoveryCode && (await this.twoFactor.consumeRecoveryCode(user.id, dto.recoveryCode)));
      if (!verified) {
        if (!dto.twoFactorCode && !dto.recoveryCode) return { status: 'twoFactorRequired' };
        this.audit.record({
          userId: user.id,
          action: AuditAction.USER_LOGIN_FAILED,
          ipAddress: meta.ipAddress,
        });
        throw new UnauthorizedException('Invalid two-factor code');
      }
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    this.audit.record({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const tokens = await this.tokens.issueSession(user, meta);
    return { status: 'ok', user: this.sanitize(user), tokens };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<IssuedTokens> {
    const tokens = await this.tokens.rotateSession(refreshToken, meta);
    if (!tokens) throw new UnauthorizedException('Session expired, please sign in again');
    return tokens;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revokeSessionByRefreshToken(refreshToken);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always behave the same whether or not the account exists, to avoid leaking which emails are registered.
    if (!user) return;

    const token = this.passwords.generateToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const resetUrl = `${this.config.get('WEB_BASE_URL', { infer: true }).split(',')[0]}/reset-password?token=${token}`;
    await this.email.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This password reset link is invalid or has expired');
    }

    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await this.tokens.revokeAllSessionsForUser(record.userId);
    await this.redis.del(`user:${record.userId}`);
    this.audit.record({ userId: record.userId, action: AuditAction.USER_PASSWORD_RESET });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.passwords.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.tokens.revokeAllSessionsForUser(userId);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = this.passwords.generateToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    const verifyUrl = `${this.config.get('WEB_BASE_URL', { infer: true }).split(',')[0]}/verify-email?token=${token}`;
    await this.email.sendVerificationEmail(user.email, verifyUrl);
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await this.redis.del(`user:${record.userId}`);
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrSvg: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.twoFactor.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    return { secret, qrSvg: this.twoFactor.buildSetupQrSvg(user.email, secret) };
  }

  async enableTwoFactor(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('Call /auth/2fa/setup first');
    if (!this.twoFactor.verifyToken(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Invalid verification code');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    await this.redis.del(`user:${userId}`);
    const recoveryCodes = await this.twoFactor.generateRecoveryCodes(userId);
    this.audit.record({ userId, action: AuditAction.USER_2FA_ENABLED });
    return { recoveryCodes };
  }

  async disableTwoFactor(userId: string, password: string, code?: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Incorrect password');
    }
    if (user.twoFactorSecret && code && !this.twoFactor.verifyToken(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Invalid verification code');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      }),
      this.prisma.twoFactorRecoveryCode.deleteMany({ where: { userId } }),
    ]);
    await this.redis.del(`user:${userId}`);
    this.audit.record({ userId, action: AuditAction.USER_2FA_DISABLED });
  }

  async findOrCreateOAuthUser(input: {
    provider: string;
    providerAccountId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<SafeUser> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (account) return this.sanitize(account.user);

    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email } });
    const user =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          emailVerified: true,
        },
      }));

    await this.prisma.account.create({
      data: {
        userId: user.id,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    });
    return this.sanitize(user);
  }

  async issueSessionForUser(userId: string, meta: RequestMeta): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.tokens.issueSession(user, meta);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
