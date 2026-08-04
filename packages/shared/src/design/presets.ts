import { ErrorCorrectionLevel, EyeBallShape, EyeFrameShape, GradientType, ModuleShape } from '../enums';
import type { QrDesign } from './schema';

export interface QrDesignPreset {
  id: string;
  label: string;
  design: QrDesign;
}

const base: Omit<QrDesign, 'moduleShape' | 'eyeFrameShape' | 'eyeBallShape' | 'moduleFill'> = {
  size: 1024,
  margin: 4,
  errorCorrectionLevel: ErrorCorrectionLevel.M,
  backgroundFill: { mode: 'solid', color: '#FFFFFF' },
  eyeFrameFill: null,
  eyeBallFill: null,
  logo: null,
  frame: null,
};

export const QR_DESIGN_PRESETS: QrDesignPreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    design: {
      ...base,
      moduleShape: ModuleShape.SQUARE,
      eyeFrameShape: EyeFrameShape.SQUARE,
      eyeBallShape: EyeBallShape.SQUARE,
      moduleFill: { mode: 'solid', color: '#000000' },
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    design: {
      ...base,
      moduleShape: ModuleShape.ROUNDED,
      eyeFrameShape: EyeFrameShape.ROUNDED,
      eyeBallShape: EyeBallShape.ROUNDED,
      moduleFill: { mode: 'solid', color: '#111827' },
    },
  },
  {
    id: 'dots',
    label: 'Dots',
    design: {
      ...base,
      moduleShape: ModuleShape.DOTS,
      eyeFrameShape: EyeFrameShape.CIRCLE,
      eyeBallShape: EyeBallShape.CIRCLE,
      moduleFill: { mode: 'solid', color: '#111827' },
    },
  },
  {
    id: 'ocean-gradient',
    label: 'Ocean Gradient',
    design: {
      ...base,
      moduleShape: ModuleShape.EXTRA_ROUNDED,
      eyeFrameShape: EyeFrameShape.ROUNDED,
      eyeBallShape: EyeBallShape.CIRCLE,
      moduleFill: {
        mode: 'gradient',
        gradient: {
          type: GradientType.LINEAR,
          rotation: 45,
          stops: [
            { offset: 0, color: '#2563EB' },
            { offset: 1, color: '#7C3AED' },
          ],
        },
      },
    },
  },
  {
    id: 'sunset-gradient',
    label: 'Sunset Gradient',
    design: {
      ...base,
      moduleShape: ModuleShape.CLASSY_ROUNDED,
      eyeFrameShape: EyeFrameShape.LEAF,
      eyeBallShape: EyeBallShape.CIRCLE,
      moduleFill: {
        mode: 'gradient',
        gradient: {
          type: GradientType.RADIAL,
          rotation: 0,
          stops: [
            { offset: 0, color: '#F59E0B' },
            { offset: 1, color: '#EF4444' },
          ],
        },
      },
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    design: {
      ...base,
      backgroundFill: { mode: 'solid', color: '#0F172A' },
      moduleShape: ModuleShape.ROUNDED,
      eyeFrameShape: EyeFrameShape.ROUNDED,
      eyeBallShape: EyeBallShape.ROUNDED,
      moduleFill: { mode: 'solid', color: '#38BDF8' },
    },
  },
];
