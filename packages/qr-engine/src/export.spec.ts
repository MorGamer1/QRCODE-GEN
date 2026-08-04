import sharp from 'sharp';
import { BinaryBitmap, Exception, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';
import {
  ErrorCorrectionLevel,
  EyeBallShape,
  EyeFrameShape,
  FrameStyle,
  ModuleShape,
  parseQrDesign,
} from '@qrgen/shared';
import { buildQrScene } from './scene';
import { renderSceneToSvg } from './svg';
import { renderScenePng } from './raster';
import { renderScenePdf } from './pdf';
import { renderSceneToEps } from './eps';

const TEXT = 'https://qr.example.com/r/AbC1234';

/**
 * Decodes a rendered PNG with ZXing - the same decoding engine behind most
 * real-world scanner apps (Android's built-in scanner, many phone camera
 * apps, etc.) - so these tests catch geometry that would genuinely fail to
 * scan, rather than quirks of any one lightweight reference decoder.
 */
async function decodePng(buffer: Buffer): Promise<string | null> {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Int32Array(info.width * info.height);
  for (let i = 0; i < pixels.length; i += 1) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    pixels[i] = (r << 16) | (g << 8) | b;
  }
  try {
    const source = new RGBLuminanceSource(pixels, info.width, info.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = new QRCodeReader().decode(bitmap);
    return result.getText();
  } catch (error) {
    // NotFoundException (no pattern located), FormatException and ChecksumException
    // (pattern located but data/ECC didn't validate) all mean "failed to scan".
    if (error instanceof Exception) return null;
    throw error;
  }
}

describe('QR round trip (scene -> PNG -> scan)', () => {
  it('scans back to the original text for the default classic design', async () => {
    const scene = buildQrScene(TEXT, parseQrDesign({ size: 512 }));
    const png = await renderScenePng(scene);
    await expect(decodePng(png)).resolves.toBe(TEXT);
  });

  it.each(Object.values(ModuleShape))('scans correctly for module shape %s', async (moduleShape) => {
    const scene = buildQrScene(TEXT, parseQrDesign({ size: 512, moduleShape }));
    const png = await renderScenePng(scene);
    await expect(decodePng(png)).resolves.toBe(TEXT);
  });

  const eyeCombos = Object.values(EyeFrameShape).flatMap((eyeFrameShape) =>
    Object.values(EyeBallShape).map((eyeBallShape) => [eyeFrameShape, eyeBallShape] as const),
  );

  it.each(eyeCombos)('scans correctly for eye frame=%s ball=%s', async (eyeFrameShape, eyeBallShape) => {
    const scene = buildQrScene(TEXT, parseQrDesign({ size: 512, eyeFrameShape, eyeBallShape }));
    const png = await renderScenePng(scene);
    await expect(decodePng(png)).resolves.toBe(TEXT);
  });

  it('still scans with a centered logo excavated at high error correction', async () => {
    // 1x1 red pixel PNG, enough for the renderer - visual fidelity of the logo isn't under test here.
    const logo =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({ size: 512, logo: { sizeRatio: 0.22, excavate: true } }),
      { logoDataUri: logo },
    );
    const png = await renderScenePng(scene);
    await expect(decodePng(png)).resolves.toBe(TEXT);
  });

  it('scans correctly with a gradient fill and a label frame', async () => {
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({
        size: 512,
        errorCorrectionLevel: ErrorCorrectionLevel.Q,
        moduleFill: {
          mode: 'gradient',
          gradient: {
            type: 'LINEAR',
            rotation: 45,
            stops: [
              { offset: 0, color: '#111111' },
              { offset: 1, color: '#1D4ED8' },
            ],
          },
        },
        frame: { style: FrameStyle.BANNER, text: 'SCAN ME' },
      }),
    );
    const png = await renderScenePng(scene);
    await expect(decodePng(png)).resolves.toBe(TEXT);
  });
});

describe('export format smoke tests', () => {
  const scene = buildQrScene(TEXT, parseQrDesign({ size: 256 }));

  it('renders a well-formed SVG document', () => {
    const svg = renderSceneToSvg(scene);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
  });

  it('renders a non-trivial PDF buffer starting with the PDF magic bytes', async () => {
    const pdf = await renderScenePdf(scene);
    expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it('renders a well-formed EPS document', () => {
    const eps = renderSceneToEps(scene, { title: 'Test QR' });
    expect(eps.startsWith('%!PS-Adobe-3.0 EPSF-3.0')).toBe(true);
    expect(eps.trim().endsWith('%%EOF')).toBe(true);
    expect(eps).toContain('%%BoundingBox: 0 0');
  });
});
