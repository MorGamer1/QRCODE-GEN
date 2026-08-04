import { ExportFormat, QrDesign } from '@qrgen/shared';
import { buildQrScene } from './scene';
import { renderSceneToSvg } from './svg';
import { renderScenePng, renderSceneWebp } from './raster';
import { renderScenePdf } from './pdf';
import { renderSceneToEps } from './eps';

export interface LogoInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ExportQrOptions {
  format: ExportFormat;
  size?: number;
  dpi?: number;
  transparentBackground?: boolean;
  title?: string;
  logo?: LogoInput | null;
}

export interface ExportQrResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  [ExportFormat.PNG]: 'image/png',
  [ExportFormat.SVG]: 'image/svg+xml',
  [ExportFormat.PDF]: 'application/pdf',
  [ExportFormat.EPS]: 'application/postscript',
  [ExportFormat.WEBP]: 'image/webp',
};

const EXTENSIONS: Record<ExportFormat, string> = {
  [ExportFormat.PNG]: 'png',
  [ExportFormat.SVG]: 'svg',
  [ExportFormat.PDF]: 'pdf',
  [ExportFormat.EPS]: 'eps',
  [ExportFormat.WEBP]: 'webp',
};

function toDataUri(logo: LogoInput): string {
  return `data:${logo.mimeType};base64,${logo.buffer.toString('base64')}`;
}

/**
 * Single entry point used by the API's export endpoints: builds the scene
 * once (honoring size/transparent-background overrides) and serializes it to
 * whichever output format was requested.
 */
export async function exportQrCode(
  text: string,
  design: QrDesign,
  options: ExportQrOptions,
): Promise<ExportQrResult> {
  const effectiveDesign: QrDesign = {
    ...design,
    size: options.size ?? design.size,
    backgroundFill: options.transparentBackground ? null : design.backgroundFill,
  };

  const scene = buildQrScene(text, effectiveDesign, {
    logoDataUri: options.logo && effectiveDesign.logo ? toDataUri(options.logo) : null,
  });

  switch (options.format) {
    case ExportFormat.SVG:
      return {
        buffer: Buffer.from(renderSceneToSvg(scene, { title: options.title }), 'utf-8'),
        contentType: CONTENT_TYPES[ExportFormat.SVG],
        extension: EXTENSIONS[ExportFormat.SVG],
      };
    case ExportFormat.PNG:
      return {
        buffer: await renderScenePng(scene, { dpi: options.dpi }),
        contentType: CONTENT_TYPES[ExportFormat.PNG],
        extension: EXTENSIONS[ExportFormat.PNG],
      };
    case ExportFormat.WEBP:
      return {
        buffer: await renderSceneWebp(scene, { dpi: options.dpi }),
        contentType: CONTENT_TYPES[ExportFormat.WEBP],
        extension: EXTENSIONS[ExportFormat.WEBP],
      };
    case ExportFormat.PDF:
      return {
        buffer: await renderScenePdf(scene, { dpi: options.dpi, title: options.title }),
        contentType: CONTENT_TYPES[ExportFormat.PDF],
        extension: EXTENSIONS[ExportFormat.PDF],
      };
    case ExportFormat.EPS:
      return {
        buffer: Buffer.from(renderSceneToEps(scene, { title: options.title }), 'latin1'),
        contentType: CONTENT_TYPES[ExportFormat.EPS],
        extension: EXTENSIONS[ExportFormat.EPS],
      };
    default:
      throw new Error(`Unsupported export format: ${options.format as string}`);
  }
}
