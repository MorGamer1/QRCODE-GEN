import { createZodDto } from 'nestjs-zod';
import {
  bulkActionSchema,
  createCategorySchema,
  createQrCodeSchema,
  createRedirectRuleSchema,
  duplicateQrSchema,
  listQrQuerySchema,
  qrExportQuerySchema,
  redirectSettingsSchema,
  reorderRedirectRulesSchema,
  updateQrContentSchema,
  updateQrDesignSchema,
  updateQrMetaSchema,
  updateRedirectRuleSchema,
} from '@qrgen/shared';

export class CreateQrCodeDto extends createZodDto(createQrCodeSchema) {}
export class UpdateQrMetaDto extends createZodDto(updateQrMetaSchema) {}
export class UpdateQrDesignDto extends createZodDto(updateQrDesignSchema) {}
export class UpdateQrContentDto extends createZodDto(updateQrContentSchema) {}
export class RedirectSettingsDto extends createZodDto(redirectSettingsSchema) {}
export class BulkActionDto extends createZodDto(bulkActionSchema) {}
export class DuplicateQrDto extends createZodDto(duplicateQrSchema) {}
export class ListQrQueryDto extends createZodDto(listQrQuerySchema) {}
export class QrExportQueryDto extends createZodDto(qrExportQuerySchema) {}
export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class CreateRedirectRuleDto extends createZodDto(createRedirectRuleSchema) {}
export class UpdateRedirectRuleDto extends createZodDto(updateRedirectRuleSchema) {}
export class ReorderRedirectRulesDto extends createZodDto(reorderRedirectRulesSchema) {}
