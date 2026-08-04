import { z } from 'zod';
import { ContentType, QrCodeType, RedirectStatusCode } from '../enums';
import { contentSchemaMap } from '../content/schemas';
import { CONTENT_TYPE_REGISTRY } from '../content/registry';
import { qrDesignSchema } from '../design/schema';
import { paginationQuerySchema } from './pagination';
import { QR_MAX_TAGS, QR_NAME_MAX_LENGTH, QR_NOTES_MAX_LENGTH, QR_TAG_MAX_LENGTH } from '../constants';

export const tagSchema = z.string().trim().min(1).max(QR_TAG_MAX_LENGTH);
export const tagsSchema = z.array(tagSchema).max(QR_MAX_TAGS).default([]);

/**
 * Envelope + per-type payload validation without a hand-rolled discriminated
 * union - keeps adding a new content type to a single registration point
 * (content/schemas.ts + content/registry.ts).
 */
export const qrContentSchema = z
  .object({
    contentType: z.nativeEnum(ContentType),
    data: z.record(z.string(), z.unknown()),
  })
  .superRefine((val, ctx) => {
    const schema = contentSchemaMap[val.contentType];
    const result = schema.safeParse(val.data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ['data', ...issue.path] });
      }
    }
  });
export type QrContentDto = z.infer<typeof qrContentSchema>;

export const createQrCodeSchema = z
  .object({
    type: z.nativeEnum(QrCodeType),
    name: z.string().trim().min(1).max(QR_NAME_MAX_LENGTH),
    tags: tagsSchema,
    categoryId: z.string().uuid().nullable().optional(),
    notes: z.string().max(QR_NOTES_MAX_LENGTH).optional(),
    design: qrDesignSchema.optional(),
    content: qrContentSchema,
  })
  .superRefine((val, ctx) => {
    const meta = CONTENT_TYPE_REGISTRY[val.content.contentType];
    if (val.type === QrCodeType.STATIC && meta.dynamicOnly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${meta.label} content requires a dynamic QR code`,
        path: ['type'],
      });
    }
  });
export type CreateQrCodeDto = z.infer<typeof createQrCodeSchema>;

export const updateQrMetaSchema = z.object({
  name: z.string().trim().min(1).max(QR_NAME_MAX_LENGTH).optional(),
  tags: tagsSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  notes: z.string().max(QR_NOTES_MAX_LENGTH).nullable().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
export type UpdateQrMetaDto = z.infer<typeof updateQrMetaSchema>;

export const updateQrDesignSchema = qrDesignSchema;
export type UpdateQrDesignDto = z.infer<typeof updateQrDesignSchema>;

/** Only valid for DYNAMIC QR codes - enforced against the stored record in the service layer. */
export const updateQrContentSchema = qrContentSchema;

export const redirectSettingsSchema = z
  .object({
    statusCode: z.nativeEnum(RedirectStatusCode).default(RedirectStatusCode.FOUND),
    expiresAt: z.string().datetime().nullable().optional(),
    password: z.string().min(4).max(64).nullable().optional(),
    scanLimit: z.number().int().positive().nullable().optional(),
    activateAt: z.string().datetime().nullable().optional(),
    deactivateAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (val) =>
      !val.activateAt || !val.deactivateAt || new Date(val.deactivateAt) > new Date(val.activateAt),
    { message: 'deactivateAt must be after activateAt', path: ['deactivateAt'] },
  );
export type RedirectSettingsDto = z.infer<typeof redirectSettingsSchema>;

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['archive', 'unarchive', 'favorite', 'unfavorite', 'delete', 'addTag', 'removeTag']),
  tag: tagSchema.optional(),
});
export type BulkActionDto = z.infer<typeof bulkActionSchema>;

export const duplicateQrSchema = z.object({
  name: z.string().trim().min(1).max(QR_NAME_MAX_LENGTH).optional(),
});
export type DuplicateQrDto = z.infer<typeof duplicateQrSchema>;

export const listQrQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (Array.isArray(val) ? val : val.split(',').filter(Boolean)))
    .optional(),
  categoryId: z.string().uuid().optional(),
  type: z.nativeEnum(QrCodeType).optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  isFavorite: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().default(false),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'totalScans', 'lastScannedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListQrQueryDto = z.infer<typeof listQrQuerySchema>;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
