import {
  ErrorCorrectionLevel,
  EyeBallShape,
  EyeFrameShape,
  Fill,
  FrameStyle,
  ModuleShape,
  QrDesign,
} from '@qrgen/shared';
import { encodeMatrix, getFinderPatternRegions, isInFinderRegion } from './matrix';
import { CornerRadii, insetRadii, ringPath, roundedRectPath, uniformRadii, ZERO_RADII } from './geometry';

export type FillRef = { kind: 'solid'; color: string } | { kind: 'gradient'; id: string };

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientDef {
  id: string;
  type: 'LINEAR' | 'RADIAL';
  rotation: number;
  stops: GradientStop[];
}

export interface QrArea {
  x: number;
  y: number;
  size: number;
}

export type DrawCommand =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: FillRef; rx?: number }
  | { kind: 'path'; d: string; fill: FillRef; fillRule?: 'evenodd' | 'nonzero' }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: FillRef }
  | { kind: 'image'; x: number; y: number; w: number; h: number; href: string; rx: number }
  | {
      kind: 'text';
      x: number;
      y: number;
      text: string;
      fontFamily: string;
      fontSize: number;
      fill: FillRef;
      anchor: 'start' | 'middle' | 'end';
    };

export interface QrScene {
  width: number;
  height: number;
  background: FillRef | null;
  gradients: GradientDef[];
  commands: DrawCommand[];
  /** QR version (1-40) the encoder selected for the given content length/EC level. */
  matrixVersion: number;
  /** May differ from design.errorCorrectionLevel - auto-upgraded to H when a logo is set. */
  effectiveErrorCorrectionLevel: ErrorCorrectionLevel;
  /** Bounding box of the QR code itself (excludes frame border/label), used to scale gradients. */
  qrArea: QrArea;
}

export interface BuildSceneOptions {
  /** data: URI (base64) for the logo image. Required for the logo to actually render. */
  logoDataUri?: string | null;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Finder-pattern (eye) detection depends on the three eyes reading as
 * uniformly dark. If eyes simply inherited a live gradient reference, the
 * eye nearest the gradient's light end can end up too pale to detect (or
 * skew the scanner's black/white threshold entirely) - so by default eyes
 * fall back to a solid color instead of the gradient itself: the darkest
 * stop when the module fill is a gradient, so it still reads as "part of
 * the same palette" without risking scannability.
 */
function representativeSolidColor(fill: Fill): string {
  if (fill.mode === 'solid') return fill.color;
  return fill.gradient.stops.reduce((darkest, stop) =>
    relativeLuminance(stop.color) < relativeLuminance(darkest.color) ? stop : darkest,
  ).color;
}

function createGradientRegistry() {
  const gradients: GradientDef[] = [];
  let counter = 0;
  function register(fill: Fill | null, fallback: FillRef | null, prefix: string): FillRef | null {
    if (!fill) return fallback;
    if (fill.mode === 'solid') return { kind: 'solid', color: fill.color };
    counter += 1;
    const id = `${prefix}-${counter}`;
    gradients.push({
      id,
      type: fill.gradient.type,
      rotation: fill.gradient.rotation,
      stops: fill.gradient.stops,
    });
    return { kind: 'gradient', id };
  }
  return { gradients, register };
}

function eyeFrameRadii(shape: EyeFrameShape, blockPx: number): CornerRadii {
  switch (shape) {
    case EyeFrameShape.ROUNDED:
      return uniformRadii(blockPx * 0.28);
    case EyeFrameShape.CIRCLE:
      return uniformRadii(blockPx * 0.5);
    case EyeFrameShape.LEAF:
      return { tl: 0, tr: blockPx * 0.5, br: 0, bl: blockPx * 0.5 };
    case EyeFrameShape.SQUARE:
    default:
      return ZERO_RADII;
  }
}

function eyeBallRadii(shape: EyeBallShape, blockPx: number): CornerRadii {
  switch (shape) {
    case EyeBallShape.ROUNDED:
      return uniformRadii(blockPx * 0.3);
    case EyeBallShape.CIRCLE:
    case EyeBallShape.DOT:
      return uniformRadii(blockPx * 0.5);
    case EyeBallShape.SQUARE:
    default:
      return ZERO_RADII;
  }
}

interface ModuleNeighbors {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

function moduleRadii(shape: ModuleShape, moduleSizePx: number, neighbors: ModuleNeighbors): CornerRadii {
  const full = moduleSizePx * 0.5;
  const soft = moduleSizePx * 0.35;

  const neighborAware = (radius: number): CornerRadii => ({
    tl: !neighbors.up && !neighbors.left ? radius : 0,
    tr: !neighbors.up && !neighbors.right ? radius : 0,
    br: !neighbors.down && !neighbors.right ? radius : 0,
    bl: !neighbors.down && !neighbors.left ? radius : 0,
  });

  switch (shape) {
    case ModuleShape.ROUNDED:
      return neighborAware(soft);
    case ModuleShape.EXTRA_ROUNDED:
      return neighborAware(full);
    case ModuleShape.CLASSY:
      return { tl: full, tr: 0, br: full, bl: 0 };
    case ModuleShape.CLASSY_ROUNDED: {
      const na = neighborAware(full);
      return { tl: full, tr: na.tr, br: full, bl: na.bl };
    }
    case ModuleShape.SQUARE:
    default:
      return ZERO_RADII;
  }
}

/**
 * Adjacent same-color modules are drawn as separate SVG shapes, each
 * anti-aliased independently by the rasterizer. At certain output sizes the
 * sub-pixel rounding of two neighboring edges doesn't line up, leaving a
 * hairline light seam inside what should read as one solid dark region -
 * confirmed via a ZXing round-trip sweep across sizes (invisible to the eye
 * but enough to occasionally break scanning). A tiny symmetric outset makes
 * neighboring shapes overlap by a sub-pixel hair instead of risking a gap.
 */
const SEAM_BLEED_PX = 0.9;

function pushRectOrPath(
  commands: DrawCommand[],
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii,
  fill: FillRef,
): void {
  const bx = x - SEAM_BLEED_PX;
  const by = y - SEAM_BLEED_PX;
  const bw = w + SEAM_BLEED_PX * 2;
  const bh = h + SEAM_BLEED_PX * 2;
  if (radii.tl === 0 && radii.tr === 0 && radii.br === 0 && radii.bl === 0) {
    commands.push({ kind: 'rect', x: bx, y: by, w: bw, h: bh, fill });
  } else {
    commands.push({ kind: 'path', d: roundedRectPath(bx, by, bw, bh, radii), fill });
  }
}

/**
 * Builds a resolution-independent draw-command scene from raw text + a
 * validated QrDesign. Pure function - no I/O, no Node APIs - so it runs
 * identically on the server and in the browser (live preview).
 */
export function buildQrScene(text: string, design: QrDesign, options: BuildSceneOptions = {}): QrScene {
  // A logo obscures part of the code; always render at max error tolerance so it stays scannable.
  const effectiveEc = design.logo ? ErrorCorrectionLevel.H : design.errorCorrectionLevel;
  const matrix = encodeMatrix(text, effectiveEc);

  const totalModules = matrix.size + design.margin * 2;
  const moduleSizePx = design.size / totalModules;
  const quietPx = design.margin * moduleSizePx;

  const frame = design.frame && design.frame.style !== FrameStyle.NONE ? design.frame : null;
  const hasLabelBand = Boolean(
    frame && (frame.style === FrameStyle.BOTTOM_LABEL || frame.style === FrameStyle.TOP_LABEL || frame.style === FrameStyle.BANNER),
  );
  const hasBorder = Boolean(frame && (frame.style === FrameStyle.BANNER || frame.style === FrameStyle.ROUNDED_BORDER));
  const labelOnTop = frame?.style === FrameStyle.TOP_LABEL;

  const borderPx = hasBorder ? moduleSizePx * 1.1 : 0;
  const labelBandPx = hasLabelBand ? moduleSizePx * 3.2 : 0;

  const offsetX = borderPx;
  const offsetY = borderPx + (labelOnTop ? labelBandPx : 0);

  const width = design.size + borderPx * 2;
  const height = design.size + borderPx * 2 + labelBandPx;

  const { gradients, register } = createGradientRegistry();
  const moduleFillRef = register(design.moduleFill, { kind: 'solid', color: '#000000' }, 'module') as FillRef;
  const defaultEyeFillRef: FillRef = { kind: 'solid', color: representativeSolidColor(design.moduleFill) };
  const eyeFrameFillRef = design.eyeFrameFill
    ? (register(design.eyeFrameFill, defaultEyeFillRef, 'eyeframe') as FillRef)
    : defaultEyeFillRef;
  const eyeBallFillRef = design.eyeBallFill
    ? (register(design.eyeBallFill, defaultEyeFillRef, 'eyeball') as FillRef)
    : defaultEyeFillRef;
  const backgroundRef = register(design.backgroundFill, null, 'bg');

  const commands: DrawCommand[] = [];

  if (frame) {
    const frameColorRef: FillRef = { kind: 'solid', color: frame.color };
    const textColorRef: FillRef = { kind: 'solid', color: frame.textColor };

    if (hasBorder) {
      const outerY = labelOnTop ? labelBandPx : 0;
      const outerRadii = uniformRadii(borderPx * 1.6);
      commands.push({
        kind: 'path',
        d: ringPath(0, outerY, width, borderPx, outerRadii, insetRadii(outerRadii, borderPx)),
        fill: frameColorRef,
        fillRule: 'evenodd',
      });
    }

    if (hasLabelBand) {
      const bandY = labelOnTop ? 0 : height - labelBandPx;
      commands.push({ kind: 'rect', x: 0, y: bandY, w: width, h: labelBandPx, fill: frameColorRef });
      commands.push({
        kind: 'text',
        x: width / 2,
        y: bandY + labelBandPx / 2 + frame.fontSize * 0.35,
        text: frame.text,
        fontFamily: frame.fontFamily,
        fontSize: frame.fontSize,
        fill: textColorRef,
        anchor: 'middle',
      });
    }
  }

  if (backgroundRef) {
    commands.push({ kind: 'rect', x: offsetX, y: offsetY, w: design.size, h: design.size, fill: backgroundRef });
  }

  let logoBox: { x: number; y: number; w: number; h: number } | null = null;
  if (design.logo) {
    const logoSizePx = design.logo.sizeRatio * matrix.size * moduleSizePx;
    const cx = offsetX + design.size / 2;
    const cy = offsetY + design.size / 2;
    logoBox = { x: cx - logoSizePx / 2, y: cy - logoSizePx / 2, w: logoSizePx, h: logoSizePx };
  }

  function overlapsLogoExclusion(px: number, py: number, pw: number, ph: number): boolean {
    if (!logoBox || !design.logo?.excavate) return false;
    const padPx = (design.logo!.padding / 100) * logoBox.w;
    const exX = logoBox.x - padPx;
    const exY = logoBox.y - padPx;
    const exW = logoBox.w + padPx * 2;
    const exH = logoBox.h + padPx * 2;
    return px + pw > exX && px < exX + exW && py + ph > exY && py < exY + exH;
  }

  const isDarkForMerge = (row: number, col: number): boolean =>
    matrix.isDark(row, col) && !isInFinderRegion(row, col, matrix.size);

  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.isDark(row, col) || isInFinderRegion(row, col, matrix.size)) continue;

      const x = offsetX + quietPx + col * moduleSizePx;
      const y = offsetY + quietPx + row * moduleSizePx;
      if (overlapsLogoExclusion(x, y, moduleSizePx, moduleSizePx)) continue;

      // The timing pattern (row/col 6) is a clock signal scanners use to measure module
      // pitch - keep it as plain full squares so decorative shapes never distort its ratio.
      const isTimingPattern = row === 6 || col === 6;

      if (isTimingPattern) {
        pushRectOrPath(commands, x, y, moduleSizePx, moduleSizePx, ZERO_RADII, moduleFillRef);
        continue;
      }

      if (design.moduleShape === ModuleShape.DOTS) {
        commands.push({
          kind: 'circle',
          cx: x + moduleSizePx / 2,
          cy: y + moduleSizePx / 2,
          r: moduleSizePx * 0.48,
          fill: moduleFillRef,
        });
        continue;
      }

      const radii = moduleRadii(design.moduleShape, moduleSizePx, {
        up: isDarkForMerge(row - 1, col),
        down: isDarkForMerge(row + 1, col),
        left: isDarkForMerge(row, col - 1),
        right: isDarkForMerge(row, col + 1),
      });
      pushRectOrPath(commands, x, y, moduleSizePx, moduleSizePx, radii, moduleFillRef);
    }
  }

  for (const region of getFinderPatternRegions(matrix.size)) {
    const blockPx = 7 * moduleSizePx;
    const bx = offsetX + quietPx + region.col * moduleSizePx;
    const by = offsetY + quietPx + region.row * moduleSizePx;
    const thickness = moduleSizePx;

    const frameRadii = eyeFrameRadii(design.eyeFrameShape, blockPx);
    commands.push({
      kind: 'path',
      d: ringPath(bx, by, blockPx, thickness, frameRadii, insetRadii(frameRadii, thickness)),
      fill: eyeFrameFillRef,
      fillRule: 'evenodd',
    });

    const ballBlockPx = 3 * moduleSizePx;
    const ballShrink = design.eyeBallShape === EyeBallShape.DOT ? ballBlockPx * 0.08 : 0;
    const ballX = bx + 2 * moduleSizePx + ballShrink;
    const ballY = by + 2 * moduleSizePx + ballShrink;
    const ballSize = ballBlockPx - ballShrink * 2;

    if (design.eyeBallShape === EyeBallShape.CIRCLE || design.eyeBallShape === EyeBallShape.DOT) {
      commands.push({
        kind: 'circle',
        cx: ballX + ballSize / 2,
        cy: ballY + ballSize / 2,
        r: ballSize / 2,
        fill: eyeBallFillRef,
      });
    } else {
      const ballRadii = eyeBallRadii(design.eyeBallShape, ballSize);
      pushRectOrPath(commands, ballX, ballY, ballSize, ballSize, ballRadii, eyeBallFillRef);
    }
  }

  if (design.logo && logoBox && options.logoDataUri) {
    if (design.logo.backgroundColor) {
      const padPx = (design.logo.padding / 100) * logoBox.w;
      const bgX = logoBox.x - padPx;
      const bgY = logoBox.y - padPx;
      const bgW = logoBox.w + padPx * 2;
      const bgH = logoBox.h + padPx * 2;
      const radiusPx = (design.logo.borderRadius / 100) * (Math.min(bgW, bgH) / 2);
      pushRectOrPath(commands, bgX, bgY, bgW, bgH, uniformRadii(radiusPx), {
        kind: 'solid',
        color: design.logo.backgroundColor,
      });
    }
    const logoRadiusPx = (design.logo.borderRadius / 100) * (Math.min(logoBox.w, logoBox.h) / 2);
    commands.push({
      kind: 'image',
      x: logoBox.x,
      y: logoBox.y,
      w: logoBox.w,
      h: logoBox.h,
      href: options.logoDataUri,
      rx: logoRadiusPx,
    });
  }

  return {
    width,
    height,
    background: backgroundRef,
    gradients,
    commands,
    matrixVersion: matrix.version,
    effectiveErrorCorrectionLevel: effectiveEc,
    qrArea: { x: offsetX, y: offsetY, size: design.size },
  };
}
