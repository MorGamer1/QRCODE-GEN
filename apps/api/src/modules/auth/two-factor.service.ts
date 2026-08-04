import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'crypto';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';
import { parseQrDesign } from '@qrgen/shared';
import type { EnvSchema } from '../../common/config/env.validation';
import { PrismaService } from '../../common/prisma/prisma.service';

const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly prisma: PrismaService,
  ) {}

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /** SVG QR code for the user to scan with their authenticator app during setup. */
  buildSetupQrSvg(email: string, secret: string): string {
    const issuer = this.config.get('TWO_FACTOR_ISSUER', { infer: true });
    const otpauthUri = authenticator.keyuri(email, issuer, secret);
    const scene = buildQrScene(otpauthUri, parseQrDesign({ size: 320, margin: 2 }));
    return renderSceneToSvg(scene);
  }

  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async generateRecoveryCodes(userId: string): Promise<string[]> {
    await this.prisma.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      formatRecoveryCode(randomBytes(5)),
    );
    await this.prisma.twoFactorRecoveryCode.createMany({
      data: codes.map((code) => ({ userId, codeHash: this.hashCode(code) })),
    });
    return codes;
  }

  async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const hash = this.hashCode(code.trim().toUpperCase());
    const record = await this.prisma.twoFactorRecoveryCode.findFirst({
      where: { userId, codeHash: hash, usedAt: null },
    });
    if (!record) return false;
    await this.prisma.twoFactorRecoveryCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return true;
  }
}

function formatRecoveryCode(bytes: Buffer): string {
  const hex = bytes.toString('hex').toUpperCase();
  return `${hex.slice(0, 5)}-${hex.slice(5, 10)}`;
}
