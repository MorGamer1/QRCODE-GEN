import { z } from 'zod';
import { UserRole } from '../enums';
import { paginationQuerySchema } from './pagination';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const adminUpdateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isSuspended: z.boolean().optional(),
  name: z.string().trim().min(1).max(100).optional(),
});
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;

export const adminListUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type AdminListUsersQueryDto = z.infer<typeof adminListUsersQuerySchema>;
