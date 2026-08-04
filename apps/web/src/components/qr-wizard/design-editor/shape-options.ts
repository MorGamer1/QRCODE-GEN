import { EyeBallShape, EyeFrameShape, ModuleShape } from '@qrgen/shared';

export interface ShapeOption {
  value: string;
  label: string;
  previewClassName: string;
}

export const MODULE_SHAPE_OPTIONS: ShapeOption[] = [
  { value: ModuleShape.SQUARE, label: 'Square', previewClassName: 'rounded-none' },
  { value: ModuleShape.ROUNDED, label: 'Rounded', previewClassName: 'rounded-md' },
  { value: ModuleShape.DOTS, label: 'Dots', previewClassName: 'rounded-full' },
  { value: ModuleShape.CLASSY, label: 'Classy', previewClassName: 'rounded-tl-lg rounded-br-lg' },
  { value: ModuleShape.CLASSY_ROUNDED, label: 'Classy Rounded', previewClassName: 'rounded-tl-xl rounded-br-xl' },
  { value: ModuleShape.EXTRA_ROUNDED, label: 'Extra Rounded', previewClassName: 'rounded-xl' },
];

export const EYE_FRAME_SHAPE_OPTIONS: ShapeOption[] = [
  { value: EyeFrameShape.SQUARE, label: 'Square', previewClassName: 'rounded-none' },
  { value: EyeFrameShape.ROUNDED, label: 'Rounded', previewClassName: 'rounded-md' },
  { value: EyeFrameShape.CIRCLE, label: 'Circle', previewClassName: 'rounded-full' },
  { value: EyeFrameShape.LEAF, label: 'Leaf', previewClassName: 'rounded-tl-xl rounded-br-xl' },
];

export const EYE_BALL_SHAPE_OPTIONS: ShapeOption[] = [
  { value: EyeBallShape.SQUARE, label: 'Square', previewClassName: 'rounded-none' },
  { value: EyeBallShape.ROUNDED, label: 'Rounded', previewClassName: 'rounded-md' },
  { value: EyeBallShape.CIRCLE, label: 'Circle', previewClassName: 'rounded-full' },
  { value: EyeBallShape.DOT, label: 'Dot', previewClassName: 'scale-75 rounded-full' },
];
