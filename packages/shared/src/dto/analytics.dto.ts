import { z } from 'zod';

export const analyticsRangeSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    timezone: z.string().max(64).optional(),
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    country: z.string().length(2).optional(),
  })
  .refine((val) => !val.from || !val.to || new Date(val.to) >= new Date(val.from), {
    message: 'to must be after from',
    path: ['to'],
  });
export type AnalyticsRangeDto = z.infer<typeof analyticsRangeSchema>;

export const analyticsExportQuerySchema = analyticsRangeSchema.and(
  z.object({
    format: z.enum(['csv', 'json']).default('csv'),
  }),
);
export type AnalyticsExportQueryDto = z.infer<typeof analyticsExportQuerySchema>;
