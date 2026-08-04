import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditAction,
  Prisma,
  type QrCodeType as PrismaQrCodeType,
  type ContentType as PrismaContentType,
} from '@prisma/client';
import {
  QrCodeType,
  buildRedirectUrl,
  encodeStaticContent,
  generateShortCode,
  parseQrDesign,
  validateContentPayload,
  buildPaginatedResult,
} from '@qrgen/shared';
import { exportQrCode, type ExportQrOptions } from '@qrgen/qr-engine/server';
import type { EnvSchema } from '../../common/config/env.validation';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { SettingsService } from '../../common/settings/settings.service';
import { RedirectCacheService } from '../../common/redirect-cache/redirect-cache.service';
import { PasswordService } from '../auth/password.service';
import { FilesService } from '../files/files.service';
import type {
  BulkActionDto,
  CreateQrCodeDto,
  DuplicateQrDto,
  ListQrQueryDto,
  QrExportQueryDto,
  RedirectSettingsDto,
  UpdateQrContentDto,
  UpdateQrDesignDto,
  UpdateQrMetaDto,
} from './dto';

const MAX_BULK = 500;

@Injectable()
export class QrCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
    private readonly redirectCache: RedirectCacheService,
    private readonly passwords: PasswordService,
    private readonly files: FilesService,
  ) {}

  private async generateUniqueShortCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateShortCode();
      const exists = await this.prisma.qrCode.findUnique({ where: { shortCode: code }, select: { id: true } });
      if (!exists) return code;
    }
    throw new BadRequestException('Could not allocate a unique short code, please try again');
  }

  async create(userId: string, dto: CreateQrCodeDto) {
    const settings = await this.settings.get();
    if (settings.maxQrCodesPerUser) {
      const count = await this.prisma.qrCode.count({ where: { userId } });
      if (count >= settings.maxQrCodesPerUser) {
        throw new ForbiddenException(`You've reached the limit of ${settings.maxQrCodesPerUser} QR codes`);
      }
    }

    const payload = validateContentPayload(dto.content.contentType, dto.content.data);
    const design = dto.design ?? parseQrDesign({});

    let shortCode: string | null = null;
    let encodedPayload: string;
    if (dto.type === QrCodeType.DYNAMIC) {
      shortCode = await this.generateUniqueShortCode();
      encodedPayload = buildRedirectUrl(this.config.get('PUBLIC_BASE_URL', { infer: true }), shortCode);
    } else {
      encodedPayload = encodeStaticContent(dto.content.contentType, payload);
    }

    const qr = await this.prisma.qrCode.create({
      data: {
        userId,
        type: dto.type as unknown as PrismaQrCodeType,
        contentType: dto.content.contentType as unknown as PrismaContentType,
        shortCode,
        content: dto.content.data as Prisma.InputJsonValue,
        encodedPayload,
        design: design as unknown as Prisma.InputJsonValue,
        name: dto.name,
        notes: dto.notes,
        tags: dto.tags,
        categoryId: dto.categoryId ?? undefined,
      },
    });

    this.audit.record({ userId, action: AuditAction.QR_CREATED, entityType: 'QrCode', entityId: qr.id });
    return qr;
  }

  async findAllForUser(userId: string, query: ListQrQueryDto) {
    const where: Prisma.QrCodeWhereInput = {
      userId,
      isArchived: query.isArchived,
      ...(query.isFavorite !== undefined ? { isFavorite: query.isFavorite } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type as unknown as PrismaQrCodeType } : {}),
      ...(query.contentType ? { contentType: query.contentType as unknown as PrismaContentType } : {}),
      ...(query.tags && query.tags.length > 0 ? { tags: { hasSome: query.tags } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.qrCode.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.qrCode.count({ where }),
    ]);

    return buildPaginatedResult(items, total, query.page, query.pageSize);
  }

  async findOneForUser(userId: string, id: string) {
    const qr = await this.prisma.qrCode.findFirst({
      where: { id, userId },
      include: { redirectRules: { orderBy: { priority: 'asc' } }, category: true },
    });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr;
  }

  private async requireOwned(userId: string, id: string) {
    const qr = await this.prisma.qrCode.findFirst({ where: { id, userId } });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr;
  }

  async updateMeta(userId: string, id: string, dto: UpdateQrMetaDto) {
    await this.requireOwned(userId, id);
    const qr = await this.prisma.qrCode.update({ where: { id }, data: dto });
    this.audit.record({ userId, action: AuditAction.QR_UPDATED, entityType: 'QrCode', entityId: id });
    await this.redirectCache.invalidate(qr.shortCode);
    return qr;
  }

  async updateDesign(userId: string, id: string, dto: UpdateQrDesignDto) {
    const existing = await this.requireOwned(userId, id);
    const qr = await this.prisma.qrCode.update({
      where: { id },
      data: { design: dto as unknown as Prisma.InputJsonValue },
    });
    this.audit.record({ userId, action: AuditAction.QR_UPDATED, entityType: 'QrCode', entityId: id });
    await this.redirectCache.invalidate(existing.shortCode);
    return qr;
  }

  async updateContent(userId: string, id: string, dto: UpdateQrContentDto) {
    const existing = await this.requireOwned(userId, id);
    if (existing.type !== 'DYNAMIC') {
      throw new BadRequestException('Static QR codes cannot be edited after creation - only dynamic QR codes support content updates');
    }
    // dto already passed qrContentSchema's per-contentType validation (see qrcode.dto.ts) at the pipe level.

    const qr = await this.prisma.qrCode.update({
      where: { id },
      data: {
        contentType: dto.contentType as unknown as PrismaContentType,
        content: dto.data as Prisma.InputJsonValue,
      },
    });
    this.audit.record({ userId, action: AuditAction.QR_UPDATED, entityType: 'QrCode', entityId: id });
    await this.redirectCache.invalidate(existing.shortCode);
    return qr;
  }

  async updateRedirectSettings(userId: string, id: string, dto: RedirectSettingsDto) {
    const existing = await this.requireOwned(userId, id);
    if (existing.type !== 'DYNAMIC') {
      throw new BadRequestException('Redirect settings only apply to dynamic QR codes');
    }

    const passwordHash =
      dto.password === undefined ? undefined : dto.password === null ? null : await this.passwords.hash(dto.password);

    const qr = await this.prisma.qrCode.update({
      where: { id },
      data: {
        redirectStatusCode: dto.statusCode,
        expiresAt: dto.expiresAt === undefined ? undefined : dto.expiresAt ? new Date(dto.expiresAt) : null,
        scanLimit: dto.scanLimit,
        activateAt: dto.activateAt === undefined ? undefined : dto.activateAt ? new Date(dto.activateAt) : null,
        deactivateAt: dto.deactivateAt === undefined ? undefined : dto.deactivateAt ? new Date(dto.deactivateAt) : null,
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
    });
    this.audit.record({ userId, action: AuditAction.QR_UPDATED, entityType: 'QrCode', entityId: id });
    await this.redirectCache.invalidate(existing.shortCode);
    return qr;
  }

  async duplicate(userId: string, id: string, dto: DuplicateQrDto) {
    const source = await this.requireOwned(userId, id);
    let shortCode: string | null = null;
    let encodedPayload = source.encodedPayload;
    if (source.type === 'DYNAMIC') {
      shortCode = await this.generateUniqueShortCode();
      encodedPayload = buildRedirectUrl(this.config.get('PUBLIC_BASE_URL', { infer: true }), shortCode);
    }

    const copy = await this.prisma.qrCode.create({
      data: {
        userId,
        type: source.type,
        contentType: source.contentType,
        shortCode,
        content: source.content as Prisma.InputJsonValue,
        encodedPayload,
        design: source.design as Prisma.InputJsonValue,
        name: dto.name ?? `${source.name} (copy)`,
        notes: source.notes,
        tags: source.tags,
        categoryId: source.categoryId,
      },
    });
    this.audit.record({ userId, action: AuditAction.QR_CREATED, entityType: 'QrCode', entityId: copy.id });
    return copy;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.requireOwned(userId, id);
    await this.prisma.qrCode.delete({ where: { id } });
    await this.redirectCache.invalidate(existing.shortCode);
    this.audit.record({ userId, action: AuditAction.QR_DELETED, entityType: 'QrCode', entityId: id });
  }

  async bulkAction(userId: string, dto: BulkActionDto): Promise<{ affected: number }> {
    const ids = dto.ids.slice(0, MAX_BULK);
    const owned = await this.prisma.qrCode.findMany({ where: { id: { in: ids }, userId }, select: { id: true, shortCode: true } });
    const ownedIds = owned.map((o) => o.id);
    if (ownedIds.length === 0) return { affected: 0 };

    switch (dto.action) {
      case 'archive':
        await this.prisma.qrCode.updateMany({ where: { id: { in: ownedIds } }, data: { isArchived: true } });
        break;
      case 'unarchive':
        await this.prisma.qrCode.updateMany({ where: { id: { in: ownedIds } }, data: { isArchived: false } });
        break;
      case 'favorite':
        await this.prisma.qrCode.updateMany({ where: { id: { in: ownedIds } }, data: { isFavorite: true } });
        break;
      case 'unfavorite':
        await this.prisma.qrCode.updateMany({ where: { id: { in: ownedIds } }, data: { isFavorite: false } });
        break;
      case 'delete':
        await this.prisma.qrCode.deleteMany({ where: { id: { in: ownedIds } } });
        this.audit.record({ userId, action: AuditAction.QR_DELETED, metadata: { count: ownedIds.length } });
        break;
      case 'addTag':
      case 'removeTag': {
        if (!dto.tag) throw new BadRequestException('tag is required for addTag/removeTag');
        const rows = await this.prisma.qrCode.findMany({ where: { id: { in: ownedIds } }, select: { id: true, tags: true } });
        await this.prisma.$transaction(
          rows.map((row) =>
            this.prisma.qrCode.update({
              where: { id: row.id },
              data: {
                tags:
                  dto.action === 'addTag'
                    ? Array.from(new Set([...row.tags, dto.tag!]))
                    : row.tags.filter((t) => t !== dto.tag),
              },
            }),
          ),
        );
        break;
      }
    }

    await Promise.all(owned.map((o) => this.redirectCache.invalidate(o.shortCode)));
    return { affected: ownedIds.length };
  }

  async export(userId: string, id: string, query: QrExportQueryDto) {
    const qr = await this.requireOwned(userId, id);
    const design = parseQrDesign(qr.design);

    let logo: ExportQrOptions['logo'] = null;
    if (design.logo?.fileId) {
      const { buffer, mimeType } = await this.files.getBuffer(design.logo.fileId, userId);
      logo = { buffer, mimeType };
    }

    const result = await exportQrCode(qr.encodedPayload, design, {
      format: query.format,
      size: query.size,
      dpi: query.dpi,
      transparentBackground: query.transparentBackground,
      title: qr.name,
      logo,
    });
    return { ...result, fileName: `${slugify(qr.name)}.${result.extension}` };
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'qr-code';
}
