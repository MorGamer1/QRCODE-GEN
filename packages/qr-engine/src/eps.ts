import type { DrawCommand, FillRef, QrScene } from './scene';

/**
 * Minimal-but-valid EPS (PostScript) writer scoped to exactly the primitives
 * `scene.ts` emits. Two deliberate, documented simplifications keep this
 * tractable instead of a fragile general SVG-to-PostScript converter:
 *
 *  - Rounded-corner paths (module/eye shapes other than plain squares and
 *    circles) render with mitered (straight) corners - true circles (DOTS
 *    module shape, CIRCLE eye shapes) are unaffected since those already use
 *    a dedicated `circle` command.
 *  - Gradient fills fall back to their first color stop as a flat fill -
 *    PostScript shading dictionaries are supported but add significant
 *    complexity for a legacy export format most commonly used for flat
 *    print-shop vector artwork.
 *  - Embedded logos are not rendered in EPS output (PNG/WebP/SVG/PDF all
 *    support logos fully) - callers should steer users toward those formats
 *    when a logo is set.
 */

function escapePsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function hexToRgb01(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const bigint = parseInt(clean.slice(0, 6), 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}

function resolveFillColor(fill: FillRef, gradients: QrScene['gradients']): string {
  if (fill.kind === 'solid') return fill.color;
  const gradient = gradients.find((g) => g.id === fill.id);
  return gradient?.stops.slice().sort((a, b) => a.offset - b.offset)[0]?.color ?? '#000000';
}

function setColorOp(hex: string): string {
  const [r, g, b] = hexToRgb01(hex);
  return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} setrgbcolor`;
}

/** Converts our restricted M/L/A/Z path grammar into straight-line PostScript path ops. */
function pathToPolygonOps(d: string): string {
  const tokens = d.match(/[MLAZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const ops: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === 'M') {
      ops.push(`${tokens[i + 1]} ${tokens[i + 2]} moveto`);
      i += 3;
    } else if (token === 'L') {
      ops.push(`${tokens[i + 1]} ${tokens[i + 2]} lineto`);
      i += 3;
    } else if (token === 'A') {
      // Approximated as a straight line to the arc endpoint - see module doc comment.
      ops.push(`${tokens[i + 6]} ${tokens[i + 7]} lineto`);
      i += 8;
    } else if (token === 'Z') {
      ops.push('closepath');
      i += 1;
    } else {
      i += 1;
    }
  }
  return ops.join('\n');
}

function textAnchorOffset(text: string, anchor: 'start' | 'middle' | 'end'): string {
  const escaped = escapePsString(text);
  if (anchor === 'middle') return `(${escaped}) stringwidth pop -2 div 0 rmoveto`;
  if (anchor === 'end') return `(${escaped}) stringwidth pop neg 0 rmoveto`;
  return '';
}

function commandToPs(cmd: DrawCommand, gradients: QrScene['gradients']): string {
  if (cmd.kind === 'image') {
    return '% logo image omitted from EPS export - see PNG/SVG/PDF for logo support';
  }

  const color = setColorOp(resolveFillColor(cmd.fill, gradients));
  switch (cmd.kind) {
    case 'rect':
      return `${color}\n${cmd.x} ${cmd.y} ${cmd.w} ${cmd.h} rectfill`;
    case 'circle':
      return `${color}\nnewpath ${cmd.cx} ${cmd.cy} ${cmd.r} 0 360 arc closepath fill`;
    case 'path':
      return `${color}\nnewpath\n${pathToPolygonOps(cmd.d)}\nfill`;
    case 'text': {
      const escaped = escapePsString(cmd.text);
      return [
        color,
        'gsave',
        `${cmd.x} ${cmd.y} translate`,
        '1 -1 scale',
        `/Helvetica-Bold findfont ${cmd.fontSize} scalefont setfont`,
        textAnchorOffset(cmd.text, cmd.anchor),
        `(${escaped}) show`,
        'grestore',
      ].join('\n');
    }
    default:
      return '';
  }
}

export interface EpsOptions {
  title?: string;
}

/** Renders a QrScene to an EPS (Encapsulated PostScript) document string. */
export function renderSceneToEps(scene: QrScene, options: EpsOptions = {}): string {
  const body = scene.commands.map((cmd) => commandToPs(cmd, scene.gradients)).join('\n');

  return [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${Math.ceil(scene.width)} ${Math.ceil(scene.height)}`,
    `%%HiResBoundingBox: 0 0 ${scene.width} ${scene.height}`,
    '%%Creator: QR Code Generator',
    options.title ? `%%Title: ${options.title.replace(/[\r\n]/g, ' ')}` : '',
    '%%Pages: 1',
    '%%EndComments',
    '%%Page: 1 1',
    // Flip to a top-left-origin, Y-down coordinate system matching scene.ts.
    `0 ${scene.height} translate`,
    '1 -1 scale',
    body,
    'showpage',
    '%%EOF',
  ]
    .filter(Boolean)
    .join('\n');
}
