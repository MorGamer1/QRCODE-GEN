import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { AuditAction } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import type { CreateApiKeyDto } from './dto';

const KEY_PREFIX = 'qrgen';

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const secret = randomBytes(24).toString('base64url');
    const rawKey = `${KEY_PREFIX}_${secret}`;
    const keyPrefix = rawKey.slice(0, 14);

    const record = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        keyPrefix,
        keyHash: hashKey(rawKey),
        scopes: dto.scopes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.audit.record({ userId, action: AuditAction.API_KEY_CREATED, entityType: 'ApiKey', entityId: record.id });

    // The only time the raw key is ever available - callers must store it now.
    return { ...record, key: rawKey };
  }

  list(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(userId: string, id: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    this.audit.record({ userId, action: AuditAction.API_KEY_REVOKED, entityType: 'ApiKey', entityId: id });
  }

  /** Used by ApiKeyGuard on every authenticated request presenting X-API-Key - keep this fast. */
  async validate(rawKey: string): Promise<RequestUser | null> {
    if (!rawKey.startsWith(`${KEY_PREFIX}_`)) return null;

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashKey(rawKey) },
      include: { user: { select: { id: true, email: true, role: true, isSuspended: true } } },
    });
    if (!record || record.revokedAt || record.user.isSuspended) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;

    // Fire-and-forget - never let usage tracking add latency to the calling request.
    void this.prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);

    return {
      id: record.user.id,
      email: record.user.email,
      role: record.user.role,
      apiKeyId: record.id,
      apiKeyScopes: record.scopes,
    };
  }
}
