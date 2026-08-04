import type { FillRef, GradientDef, QrArea, QrScene } from './scene';

function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fillToAttr(fill: FillRef | null): string {
  if (!fill) return 'none';
  if (fill.kind === 'solid') return fill.color;
  return `url(#${fill.id})`;
}

/**
 * Gradients are shared by many separate <rect>/<path> elements (one per QR
 * module), so they must use userSpaceOnUse coordinates sized to the whole QR
 * area. The default objectBoundingBox units would make every element map the
 * gradient across its own tiny bounding box, producing a "static" look where
 * every module fades independently instead of one smooth wash across the code.
 */
function renderGradientDef(def: GradientDef, qrArea: QrArea): string {
  const stops = def.stops
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .map((s) => `<stop offset="${fmt(s.offset * 100)}%" stop-color="${s.color}"/>`)
    .join('');

  const cx = qrArea.x + qrArea.size / 2;
  const cy = qrArea.y + qrArea.size / 2;

  if (def.type === 'RADIAL') {
    const r = qrArea.size / 2;
    return `<radialGradient id="${def.id}" gradientUnits="userSpaceOnUse" cx="${fmt(cx)}" cy="${fmt(
      cy,
    )}" r="${fmt(r)}">${stops}</radialGradient>`;
  }

  const angleRad = (def.rotation * Math.PI) / 180;
  const dx = Math.cos(angleRad) * (qrArea.size / 2);
  const dy = Math.sin(angleRad) * (qrArea.size / 2);
  return `<linearGradient id="${def.id}" gradientUnits="userSpaceOnUse" x1="${fmt(cx - dx)}" y1="${fmt(
    cy - dy,
  )}" x2="${fmt(cx + dx)}" y2="${fmt(cy + dy)}">${stops}</linearGradient>`;
}

export interface RenderSvgOptions {
  title?: string;
}

/** Serializes a QrScene to a standalone SVG document string. */
export function renderSceneToSvg(scene: QrScene, options: RenderSvgOptions = {}): string {
  const gradientDefs = scene.gradients.map((def) => renderGradientDef(def, scene.qrArea));
  const clipDefs: string[] = [];
  let clipCounter = 0;

  const body = scene.commands
    .map((cmd) => {
      switch (cmd.kind) {
        case 'rect':
          return `<rect x="${fmt(cmd.x)}" y="${fmt(cmd.y)}" width="${fmt(cmd.w)}" height="${fmt(
            cmd.h,
          )}"${cmd.rx ? ` rx="${fmt(cmd.rx)}"` : ''} fill="${fillToAttr(cmd.fill)}"/>`;
        case 'path':
          return `<path d="${cmd.d}" fill="${fillToAttr(cmd.fill)}"${
            cmd.fillRule ? ` fill-rule="${cmd.fillRule}"` : ''
          }/>`;
        case 'circle':
          return `<circle cx="${fmt(cmd.cx)}" cy="${fmt(cmd.cy)}" r="${fmt(cmd.r)}" fill="${fillToAttr(
            cmd.fill,
          )}"/>`;
        case 'image': {
          let clipAttr = '';
          if (cmd.rx > 0) {
            clipCounter += 1;
            const clipId = `imgclip-${clipCounter}`;
            clipDefs.push(
              `<clipPath id="${clipId}"><rect x="${fmt(cmd.x)}" y="${fmt(cmd.y)}" width="${fmt(
                cmd.w,
              )}" height="${fmt(cmd.h)}" rx="${fmt(cmd.rx)}"/></clipPath>`,
            );
            clipAttr = ` clip-path="url(#${clipId})"`;
          }
          return `<image x="${fmt(cmd.x)}" y="${fmt(cmd.y)}" width="${fmt(cmd.w)}" height="${fmt(
            cmd.h,
          )}" href="${escapeXml(cmd.href)}" xlink:href="${escapeXml(cmd.href)}"${clipAttr} preserveAspectRatio="xMidYMid slice"/>`;
        }
        case 'text':
          return `<text x="${fmt(cmd.x)}" y="${fmt(cmd.y)}" font-family="${escapeXml(
            cmd.fontFamily,
          )}" font-size="${fmt(cmd.fontSize)}" fill="${fillToAttr(cmd.fill)}" text-anchor="${
            cmd.anchor
          }" font-weight="600">${escapeXml(cmd.text)}</text>`;
        default:
          return '';
      }
    })
    .join('');

  const defsContent = [...gradientDefs, ...clipDefs].join('');
  const titleTag = options.title ? `<title>${escapeXml(options.title)}</title>` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${fmt(scene.width)}" height="${fmt(scene.height)}" viewBox="0 0 ${fmt(scene.width)} ${fmt(
      scene.height,
    )}">${titleTag}${defsContent ? `<defs>${defsContent}</defs>` : ''}${body}</svg>`
  );
}
