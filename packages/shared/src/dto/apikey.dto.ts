import { z } from 'zod';
import { ApiKeyScope } from '../enums';

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
