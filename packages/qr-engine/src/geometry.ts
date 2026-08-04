export interface CornerRadii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export const ZERO_RADII: CornerRadii = { tl: 0, tr: 0, br: 0, bl: 0 };

export function uniformRadii(r: number): CornerRadii {
  return { tl: r, tr: r, br: r, bl: r };
}

export function insetRadii(r: CornerRadii, amount: number): CornerRadii {
  return {
    tl: Math.max(0, r.tl - amount),
    tr: Math.max(0, r.tr - amount),
    br: Math.max(0, r.br - amount),
    bl: Math.max(0, r.bl - amount),
  };
}

/**
 * Builds an SVG path `d` string for a rectangle with an independent corner
 * radius per corner (native SVG `rect` only supports a single uniform rx/ry,
 * which is not enough for "classy" / neighbor-aware QR module rendering).
 */
export function roundedRectPath(x: number, y: number, w: number, h: number, r: CornerRadii): string {
  const tl = Math.min(r.tl, w / 2, h / 2);
  const tr = Math.min(r.tr, w / 2, h / 2);
  const br = Math.min(r.br, w / 2, h / 2);
  const bl = Math.min(r.bl, w / 2, h / 2);

  return [
    `M ${x + tl} ${y}`,
    `L ${x + w - tr} ${y}`,
    tr > 0 ? `A ${tr} ${tr} 0 0 1 ${x + w} ${y + tr}` : '',
    `L ${x + w} ${y + h - br}`,
    br > 0 ? `A ${br} ${br} 0 0 1 ${x + w - br} ${y + h}` : '',
    `L ${x + bl} ${y + h}`,
    bl > 0 ? `A ${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` : '',
    `L ${x} ${y + tl}`,
    tl > 0 ? `A ${tl} ${tl} 0 0 1 ${x + tl} ${y}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Ring (donut) path: outer rounded rect minus an inset inner rounded rect, evenodd fill. */
export function ringPath(
  x: number,
  y: number,
  size: number,
  thickness: number,
  outerRadii: CornerRadii,
  innerRadii: CornerRadii,
): string {
  const outer = roundedRectPath(x, y, size, size, outerRadii);
  const inner = roundedRectPath(x + thickness, y + thickness, size - thickness * 2, size - thickness * 2, innerRadii);
  return `${outer} ${inner}`;
}
