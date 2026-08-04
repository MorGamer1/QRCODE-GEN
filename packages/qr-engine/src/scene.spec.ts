import { ErrorCorrectionLevel, FrameStyle, ModuleShape, parseQrDesign } from '@qrgen/shared';
import { buildQrScene } from './scene';

const TEXT = 'https://example.com/r/AbC1234';
const TINY_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('buildQrScene', () => {
  it('draws an opaque background rect by default', () => {
    const scene = buildQrScene(TEXT, parseQrDesign({}));
    expect(scene.background).toEqual({ kind: 'solid', color: '#FFFFFF' });
    expect(scene.commands.some((c) => c.kind === 'rect' && c.fill === scene.background)).toBe(true);
  });

  it('omits the background entirely when backgroundFill is null (transparent)', () => {
    const scene = buildQrScene(TEXT, parseQrDesign({ backgroundFill: null }));
    expect(scene.background).toBeNull();
  });

  it('keeps the requested error correction level when there is no logo', () => {
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({ errorCorrectionLevel: ErrorCorrectionLevel.L }),
    );
    expect(scene.effectiveErrorCorrectionLevel).toBe(ErrorCorrectionLevel.L);
  });

  it('auto-upgrades error correction to H whenever a logo is present', () => {
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({ errorCorrectionLevel: ErrorCorrectionLevel.L, logo: {} }),
      { logoDataUri: TINY_PNG_DATA_URI },
    );
    expect(scene.effectiveErrorCorrectionLevel).toBe(ErrorCorrectionLevel.H);
  });

  it('excavates fewer modules when logo excavation is enabled vs. disabled', () => {
    const withExcavation = buildQrScene(
      TEXT,
      parseQrDesign({ logo: { sizeRatio: 0.35, excavate: true } }),
      { logoDataUri: TINY_PNG_DATA_URI },
    );
    const withoutExcavation = buildQrScene(
      TEXT,
      parseQrDesign({ logo: { sizeRatio: 0.35, excavate: false } }),
      { logoDataUri: TINY_PNG_DATA_URI },
    );
    expect(withExcavation.commands.length).toBeLessThan(withoutExcavation.commands.length);
  });

  it('registers one gradient definition when the module fill is a gradient', () => {
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({
        moduleFill: {
          mode: 'gradient',
          gradient: {
            type: 'LINEAR',
            rotation: 45,
            stops: [
              { offset: 0, color: '#000000' },
              { offset: 1, color: '#333333' },
            ],
          },
        },
      }),
    );
    expect(scene.gradients).toHaveLength(1);
  });

  it('produces a square canvas when no frame is set', () => {
    const scene = buildQrScene(TEXT, parseQrDesign({}));
    expect(scene.width).toBe(scene.height);
  });

  it('grows only the height for a bottom label frame (no border)', () => {
    const scene = buildQrScene(TEXT, parseQrDesign({ frame: { style: FrameStyle.BOTTOM_LABEL } }));
    expect(scene.height).toBeGreaterThan(scene.width);
  });

  it('grows both dimensions equally for a border-only frame (still square)', () => {
    const scene = buildQrScene(
      TEXT,
      parseQrDesign({ frame: { style: FrameStyle.ROUNDED_BORDER } }),
    );
    expect(scene.width).toBe(scene.height);
    expect(scene.width).toBeGreaterThan(1024);
  });

  it('renders DOTS modules as circle commands', () => {
    const scene = buildQrScene(TEXT, parseQrDesign({ moduleShape: ModuleShape.DOTS }));
    expect(scene.commands.some((c) => c.kind === 'circle')).toBe(true);
  });
});
