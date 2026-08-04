import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { adminListUsersQuerySchema, adminSettingsSchema, adminUpdateUserSchema, paginationQuerySchema } from '@qrgen/shared';

export class AdminListUsersQueryDto extends createZodDto(adminListUsersQuerySchema) {}
export class AdminUpdateUserDto extends createZodDto(adminUpdateUserSchema) {}
export class AdminSettingsDto extends createZodDto(adminSettingsSchema) {}

export const adminListQrQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
});
export class AdminListQrQueryDto extends createZodDto(adminListQrQuerySchema) {}

export const auditLogQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
});
export class AuditLogQueryDto extends createZodDto(auditLogQuerySchema) {}
