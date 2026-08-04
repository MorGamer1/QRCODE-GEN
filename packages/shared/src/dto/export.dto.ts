import { z } from 'zod';
import { ExportFormat } from '../enums';
import { QR_EXPORT_SIZE_MAX, QR_EXPORT_SIZE_MIN } from '../constants';
import { booleanFromString } from './pagination';

export const qrExportQuerySchema = z.object({
  format: z.nativeEnum(ExportFormat).default(ExportFormat.PNG),
  size: z.coerce.number().int().min(QR_EXPORT_SIZE_MIN).max(QR_EXPORT_SIZE_MAX).optional(),
  dpi: z.coerce.number().int().min(72).max(1200).optional(),
  transparentBackground: booleanFromString().optional(),
});
export type QrExportQueryDto = z.infer<typeof qrExportQuerySchema>;
