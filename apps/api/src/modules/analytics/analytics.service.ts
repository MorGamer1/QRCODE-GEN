import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { buildPaginatedResult } from '@qrgen/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { bucketDaily, resolveDateRange, truncateToUtcDay } from './date-range.util';
import { toCsv } from './csv.util';
import type {
  AnalyticsExportQueryDto,
  AnalyticsRangeDto,
  BreakdownQueryDto,
  ScanListQueryDto,
} from './dto';

const SCAN_EXPORT_COLUMNS = [
  'id',
  'scannedAt',
  'isUnique',
  'country',
  'region',
  'city',
  'deviceType',
  'os',
  'browser',
  'language',
  'referrer',
  'timezone',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireOwnedQr(userId: string, qrCodeId: string) {
    const qr = await this.prisma.qrCode.findFirst({ where: { id: qrCodeId, userId } });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr;
  }

  async summary(userId: string, qrCodeId: string) {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    return {
      totalScans: qr.totalScans,
      uniqueScans: qr.uniqueScans,
      firstScannedAt: qr.firstScannedAt,
      lastScannedAt: qr.lastScannedAt,
    };
  }

  async timeseries(userId: string, qrCodeId: string, range: AnalyticsRangeDto) {
    await this.requireOwnedQr(userId, qrCodeId);
    const { from, to } = resolveDateRange(range);

    if (range.granularity === 'hour') {
      const rows = await this.prisma.$queryRaw<{ bucket: Date; total: number; unique: number }[]>`
        SELECT date_trunc('hour', "scannedAt") as bucket,
               count(*)::int as total,
               count(*) filter (where "isUnique")::int as unique
        FROM scans
        WHERE "qrCodeId" = ${qrCodeId} AND "scannedAt" BETWEEN ${from} AND ${to}
        GROUP BY bucket ORDER BY bucket ASC
      `;
      return rows.map((r) => ({
        bucket: r.bucket.toISOString(),
        totalScans: r.total,
        uniqueScans: r.unique,
      }));
    }

    const daily = await this.prisma.scanDailyStat.findMany({
      where: { qrCodeId, date: { gte: truncateToUtcDay(from), lte: truncateToUtcDay(to) } },
      orderBy: { date: 'asc' },
    });

    if (range.granularity === 'day') {
      return daily.map((d) => ({
        bucket: d.date.toISOString().slice(0, 10),
        totalScans: d.totalScans,
        uniqueScans: d.uniqueScans,
      }));
    }
    return bucketDaily(daily, range.granularity);
  }

  async breakdown(userId: string, qrCodeId: string, query: BreakdownQueryDto) {
    await this.requireOwnedQr(userId, qrCodeId);
    const { from, to } = resolveDateRange(query);
    const field = query.dimension as keyof Prisma.ScanGroupByOutputType;

    const rows = await this.prisma.scan.groupBy({
      by: [field] as Prisma.ScanScalarFieldEnum[],
      where: { qrCodeId, scannedAt: { gte: from, lte: to } },
      _count: { _all: true },
    });

    return rows
      .map((row) => ({
        value: (row as Record<string, unknown>)[field] ?? 'Unknown',
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async scanList(userId: string, qrCodeId: string, query: ScanListQueryDto) {
    await this.requireOwnedQr(userId, qrCodeId);
    const { from, to } = resolveDateRange(query);
    const where: Prisma.ScanWhereInput = { qrCodeId, scannedAt: { gte: from, lte: to } };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.scan.findMany({
        where,
        orderBy: { scannedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.scan.count({ where }),
    ]);
    return buildPaginatedResult(items, total, query.page, query.pageSize);
  }

  async exportScans(
    userId: string,
    qrCodeId: string,
    query: AnalyticsExportQueryDto,
  ): Promise<{ body: string; contentType: string; fileName: string }> {
    const qr = await this.requireOwnedQr(userId, qrCodeId);
    const { from, to } = resolveDateRange(query);
    const scans = await this.prisma.scan.findMany({
      where: { qrCodeId, scannedAt: { gte: from, lte: to } },
      orderBy: { scannedAt: 'desc' },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    if (query.format === 'json') {
      return {
        body: JSON.stringify(scans, null, 2),
        contentType: 'application/json',
        fileName: `${qr.name}-scans-${stamp}.json`,
      };
    }
    return {
      body: toCsv(scans, SCAN_EXPORT_COLUMNS),
      contentType: 'text/csv',
      fileName: `${qr.name}-scans-${stamp}.csv`,
    };
  }

  async overview(userId: string, range: AnalyticsRangeDto) {
    const qrCodes = await this.prisma.qrCode.findMany({
      where: { userId },
      select: { id: true, name: true, totalScans: true, uniqueScans: true },
    });
    const totalScans = qrCodes.reduce((sum, q) => sum + q.totalScans, 0);
    const totalUnique = qrCodes.reduce((sum, q) => sum + q.uniqueScans, 0);
    const topQrCodes = [...qrCodes].sort((a, b) => b.totalScans - a.totalScans).slice(0, 10);

    const { from, to } = resolveDateRange(range);
    const daily = await this.prisma.scanDailyStat.groupBy({
      by: ['date'],
      where: {
        qrCode: { userId },
        date: { gte: truncateToUtcDay(from), lte: truncateToUtcDay(to) },
      },
      _sum: { totalScans: true, uniqueScans: true },
      orderBy: { date: 'asc' },
    });

    return {
      totalScans,
      totalUniqueScans: totalUnique,
      totalQrCodes: qrCodes.length,
      topQrCodes,
      timeseries: daily.map((d) => ({
        bucket: d.date.toISOString().slice(0, 10),
        totalScans: d._sum.totalScans ?? 0,
        uniqueScans: d._sum.uniqueScans ?? 0,
      })),
    };
  }
}
