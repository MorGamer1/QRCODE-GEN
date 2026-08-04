import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, RedirectRuleType as PrismaRedirectRuleType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedirectCacheService } from '../../common/redirect-cache/redirect-cache.service';
import type { CreateRedirectRuleDto, ReorderRedirectRulesDto, UpdateRedirectRuleDto } from './dto';

@Injectable()
export class RedirectRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redirectCache: RedirectCacheService,
  ) {}

  private async requireOwnedQr(userId: string, qrCodeId: string) {
    const qr = await this.prisma.qrCode.findFirst({ where: { id: qrCodeId, userId } });
    if (!qr) throw new NotFoundException('QR code not found');
    if (qr.type !== 'DYNAMIC') throw new BadRequestException('Smart redirect rules only apply to dynamic QR codes');
    return qr;
  }

  list(userId: string, qrCodeId: string) {
    return this.requireOwnedQr(userId, qrCodeId).then(() =>
      this.prisma.redirectRule.findMany({ where: { qrCodeId }, orderBy: { priority: 'asc' } }),
    );
  }

  async create(userId: string, qrCodeId: string, dto: CreateRedirectRuleDto) {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    const rule = await this.prisma.redirectRule.create({
      data: {
        qrCodeId,
        type: dto.type as unknown as PrismaRedirectRuleType,
        condition: dto.condition as Prisma.InputJsonValue,
        destinationUrl: dto.destinationUrl,
        priority: dto.priority,
        isActive: dto.isActive,
      },
    });
    await this.redirectCache.invalidate(qr.shortCode);
    return rule;
  }

  async update(userId: string, qrCodeId: string, ruleId: string, dto: UpdateRedirectRuleDto) {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    const existing = await this.prisma.redirectRule.findFirst({ where: { id: ruleId, qrCodeId } });
    if (!existing) throw new NotFoundException('Redirect rule not found');

    const rule = await this.prisma.redirectRule.update({
      where: { id: ruleId },
      data: {
        type: dto.type as unknown as PrismaRedirectRuleType,
        condition: dto.condition as Prisma.InputJsonValue,
        destinationUrl: dto.destinationUrl,
        priority: dto.priority,
        isActive: dto.isActive,
      },
    });
    await this.redirectCache.invalidate(qr.shortCode);
    return rule;
  }

  async remove(userId: string, qrCodeId: string, ruleId: string): Promise<void> {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    const existing = await this.prisma.redirectRule.findFirst({ where: { id: ruleId, qrCodeId } });
    if (!existing) throw new NotFoundException('Redirect rule not found');
    await this.prisma.redirectRule.delete({ where: { id: ruleId } });
    await this.redirectCache.invalidate(qr.shortCode);
  }

  async reorder(userId: string, qrCodeId: string, dto: ReorderRedirectRulesDto): Promise<void> {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    const owned = await this.prisma.redirectRule.findMany({ where: { qrCodeId }, select: { id: true } });
    const ownedIds = new Set(owned.map((r) => r.id));
    const validOrder = dto.orderedIds.filter((id) => ownedIds.has(id));

    await this.prisma.$transaction(
      validOrder.map((id, index) => this.prisma.redirectRule.update({ where: { id }, data: { priority: index } })),
    );
    await this.redirectCache.invalidate(qr.shortCode);
  }
}
