import { z } from 'zod';
import { RedirectRuleType } from '../enums';

export const redirectRuleConditionSchemas = {
  [RedirectRuleType.DEVICE]: z.object({
    devices: z.array(z.enum(['ios', 'android', 'desktop', 'other'])).min(1),
  }),
  [RedirectRuleType.COUNTRY]: z.object({
    countries: z.array(z.string().length(2)).min(1),
  }),
  [RedirectRuleType.LANGUAGE]: z.object({
    languages: z.array(z.string().min(2).max(35)).min(1),
  }),
  [RedirectRuleType.TIME]: z.object({
    days: z.array(z.number().int().min(0).max(6)).min(1),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
    timezone: z.string().min(1).max(64),
  }),
} as const;

export const createRedirectRuleSchema = z
  .object({
    type: z.nativeEnum(RedirectRuleType),
    condition: z.record(z.string(), z.unknown()),
    destinationUrl: z.string().trim().url(),
    priority: z.number().int().min(0).max(1000).default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    const schema = redirectRuleConditionSchemas[val.type];
    const result = schema.safeParse(val.condition);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ['condition', ...issue.path] });
      }
    }
  });
export type CreateRedirectRuleDto = z.infer<typeof createRedirectRuleSchema>;

export const updateRedirectRuleSchema = createRedirectRuleSchema;
export type UpdateRedirectRuleDto = z.infer<typeof updateRedirectRuleSchema>;

export const reorderRedirectRulesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderRedirectRulesDto = z.infer<typeof reorderRedirectRulesSchema>;
