import { z } from 'zod';
import { RedirectStatusCode } from '../enums';

export const adminSettingsSchema = z.object({
  gdprStoreIp: z.boolean().optional(),
  gdprHashIp: z.boolean().optional(),
  defaultRedirectStatusCode: z.nativeEnum(RedirectStatusCode).optional(),
  allowPublicRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  maxQrCodesPerUser: z.number().int().positive().nullable().optional(),
});
export type AdminSettingsDto = z.infer<typeof adminSettingsSchema>;
