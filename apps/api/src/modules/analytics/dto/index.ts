import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { analyticsExportQuerySchema, analyticsRangeSchema, paginationQuerySchema } from '@qrgen/shared';

export class AnalyticsRangeDto extends createZodDto(analyticsRangeSchema) {}
export class AnalyticsExportQueryDto extends createZodDto(analyticsExportQuerySchema) {}

export const breakdownDimensionSchema = analyticsRangeSchema.and(
  z.object({
    dimension: z.enum(['country', 'city', 'deviceType', 'os', 'browser', 'language', 'referrer', 'utmSource', 'utmCampaign']),
  }),
);
export class BreakdownQueryDto extends createZodDto(breakdownDimensionSchema) {}

export const scanListQuerySchema = analyticsRangeSchema.and(paginationQuerySchema);
export class ScanListQueryDto extends createZodDto(scanListQuerySchema) {}
