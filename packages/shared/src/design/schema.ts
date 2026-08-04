import { z } from 'zod';
import {
  ErrorCorrectionLevel,
  EyeBallShape,
  EyeFrameShape,
  FrameStyle,
  GradientType,
  ModuleShape,
} from '../enums';
import { hexColor } from '../content/schemas';

export const colorStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: hexColor(),
});
export type ColorStop = z.infer<typeof colorStopSchema>;

export const gradientSchema = z.object({
  type: z.nativeEnum(GradientType).default(GradientType.LINEAR),
  rotation: z.number().min(0).max(360).default(0),
  stops: z.array(colorStopSchema).min(2).max(6),
});
export type Gradient = z.infer<typeof gradientSchema>;

export const fillSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('solid'), color: hexColor() }),
  z.object({ mode: z.literal('gradient'), gradient: gradientSchema }),
]);
export type Fill = z.infer<typeof fillSchema>;

export const logoOptionsSchema = z.object({
  fileId: z.string().uuid().nullable().default(null),
  /** Logo width relative to the QR code's total size, e.g. 0.2 = 20%. */
  sizeRatio: z.number().min(0.05).max(0.4).default(0.2),
  /** Background pad, as a percentage of the logo box size (resolution-independent). */
  padding: z.number().min(0).max(30).default(8),
  backgroundColor: hexColor().nullable().default('#FFFFFF'),
  /** Corner rounding, as a percentage of half the box size. 100 = fully circular. */
  borderRadius: z.number().min(0).max(100).default(0),
  rotation: z.number().min(0).max(360).default(0),
  /** Remove QR modules behind the logo so it never overlaps encoded data. */
  excavate: z.boolean().default(true),
});
export type LogoOptions = z.infer<typeof logoOptionsSchema>;

export const frameOptionsSchema = z.object({
  style: z.nativeEnum(FrameStyle).default(FrameStyle.NONE),
  text: z.string().max(60).default('SCAN ME'),
  textColor: hexColor().default('#FFFFFF'),
  color: hexColor().default('#000000'),
  fontFamily: z.string().max(60).default('Inter, sans-serif'),
  fontSize: z.number().min(8).max(48).default(16),
});
export type FrameOptions = z.infer<typeof frameOptionsSchema>;

export const qrDesignSchema = z.object({
  size: z.number().min(128).max(4096).default(1024),
  /** Quiet zone width, expressed in modules. */
  margin: z.number().min(0).max(20).default(4),
  errorCorrectionLevel: z.nativeEnum(ErrorCorrectionLevel).default(ErrorCorrectionLevel.M),
  moduleShape: z.nativeEnum(ModuleShape).default(ModuleShape.SQUARE),
  moduleFill: fillSchema.default({ mode: 'solid', color: '#000000' }),
  /** null = transparent background */
  backgroundFill: fillSchema.nullable().default({ mode: 'solid', color: '#FFFFFF' }),
  eyeFrameShape: z.nativeEnum(EyeFrameShape).default(EyeFrameShape.SQUARE),
  eyeBallShape: z.nativeEnum(EyeBallShape).default(EyeBallShape.SQUARE),
  /** null = inherit moduleFill */
  eyeFrameFill: fillSchema.nullable().default(null),
  eyeBallFill: fillSchema.nullable().default(null),
  logo: logoOptionsSchema.nullable().default(null),
  frame: frameOptionsSchema.nullable().default(null),
});
export type QrDesign = z.infer<typeof qrDesignSchema>;

export function parseQrDesign(input: unknown): QrDesign {
  return qrDesignSchema.parse(input ?? {});
}
