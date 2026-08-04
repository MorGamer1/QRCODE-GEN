import sharp from 'sharp';
import type { QrScene } from './scene';
import { renderSceneToSvg } from './svg';

export interface RasterOptions {
  width?: number;
  height?: number;
  /** Embedded print-DPI metadata tag only - does not affect pixel dimensions. */
  dpi?: number;
}

async function rasterize(
  scene: QrScene,
  format: 'png' | 'webp',
  options: RasterOptions,
): Promise<Buffer> {
  const svg = renderSceneToSvg(scene);
  const aspect = scene.height / scene.width;
  const width = Math.round(options.width ?? scene.width);
  const height = Math.round(options.height ?? width * aspect);

  // Rasterize the SVG directly at the target pixel size: `density` (DPI) is how
  // sharp/librsvg scales an SVG's own user-unit dimensions (assumed 96 DPI) up
  // to physical pixels *before* any resize. Picking it so that maps 1:1 to
  // `width` avoids a mismatched supersample-then-downscale pass - which, at
  // certain scale ratios, produced hairline seams between adjacent same-color
  // modules that broke real QR scanners (confirmed via a ZXing round-trip
  // sweep across sizes). `.resize()` stays only as an exactness safety net,
  // now a near-identity op instead of a large rescale.
  const density = 96 * (width / scene.width);

  const pipeline = sharp(Buffer.from(svg), { density }).resize(width, height, { fit: 'fill' });
  if (options.dpi) pipeline.withMetadata({ density: options.dpi });

  return format === 'png'
    ? pipeline.png({ quality: 100, compressionLevel: 9 }).toBuffer()
    : pipeline.webp({ quality: 100 }).toBuffer();
}

export function renderScenePng(scene: QrScene, options: RasterOptions = {}): Promise<Buffer> {
  return rasterize(scene, 'png', options);
}

export function renderSceneWebp(scene: QrScene, options: RasterOptions = {}): Promise<Buffer> {
  return rasterize(scene, 'webp', options);
}
