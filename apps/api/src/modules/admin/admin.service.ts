import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditAction } from '@prisma/client';
import { buildPaginatedResult } from '@qrgen/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SettingsService } from '../../common/settings/settings.service';
import { AuditService } from '../../common/audit/audit.service';
import { sanitizeQr } from '../qr-codes/qr-codes.service';
import type { AdminListQrQueryDto, AdminListUsersQueryDto, AdminSettingsDto, AdminUpdateUserDto, AuditLogQueryDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(query: AdminListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { name: { contains: query.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuspended: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { qrCodes: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return buildPaginatedResult(items, total, query.page, query.pageSize);
  }

  async updateUser(adminId: string, userId: string, dto: AdminUpdateUserDto) {
    if (adminId === userId && (dto.role || dto.isSuspended)) {
      throw new BadRequestException("You can't change your own role or suspension status - ask another admin");
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    await this.redis.del(`user:${userId}`);
    this.audit.record({
      userId: adminId,
      action: dto.role ? AuditAction.USER_ROLE_CHANGED : dto.isSuspended ? AuditAction.USER_SUSPENDED : AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: userId,
      metadata: dto as Record<string, unknown>,
    });
    return user;
  }

  async deleteUser(adminId: string, userId: string): Promise<void> {
    if (adminId === userId) throw new BadRequestException("You can't delete your own account");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id: userId } });
    this.audit.record({ userId: adminId, action: AuditAction.USER_DELETED, entityType: 'User', entityId: userId });
  }

  async listQrCodes(query: AdminListQrQueryDto) {
    const where: Prisma.QrCodeWhereInput = query.search
      ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { shortCode: { contains: query.search, mode: 'insensitive' } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.qrCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.qrCode.count({ where }),
    ]);
    return buildPaginatedResult(items.map(sanitizeQr), total, query.page, query.pageSize);
  }

  async deleteQrCode(adminId: string, qrCodeId: string): Promise<void> {
    const qr = await this.prisma.qrCode.findUnique({ where: { id: qrCodeId } });
    if (!qr) throw new NotFoundException('QR code not found');
    await this.prisma.qrCode.delete({ where: { id: qrCodeId } });
    this.audit.record({ userId: adminId, action: AuditAction.QR_DELETED, entityType: 'QrCode', entityId: qrCodeId, metadata: { admin: true } });
  }

  async stats() {
    const [totalUsers, totalQrCodes, totalScans, totalDynamic, activeToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.qrCode.count(),
      this.prisma.scan.count(),
      this.prisma.qrCode.count({ where: { type: 'DYNAMIC' } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);
    return { totalUsers, totalQrCodes, totalStaticQrCodes: totalQrCodes - totalDynamic, totalDynamicQrCodes: totalDynamic, totalScans, activeUsersToday: activeToday };
  }

  getSettings() {
    return this.settings.get();
  }

  async updateSettings(adminId: string, dto: AdminSettingsDto) {
    const updated = await this.settings.update(dto);
    this.audit.record({ userId: adminId, action: AuditAction.ADMIN_SETTINGS_UPDATED, metadata: dto as Record<string, unknown> });
    return updated;
  }

  async auditLogs(query: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.action ? { action: query.action as Prisma.EnumAuditActionFilter['equals'] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return buildPaginatedResult(items, total, query.page, query.pageSize);
  }
}
