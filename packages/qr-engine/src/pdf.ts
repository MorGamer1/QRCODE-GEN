import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import type { QrScene } from './scene';
import { renderSceneToSvg } from './svg';

export interface PdfOptions {
  /** Dots-per-inch used to convert the scene's pixel size into a physical page size. */
  dpi?: number;
  title?: string;
}

/** Renders a QrScene into a single-page vector PDF sized for the requested print DPI. */
export function renderScenePdf(scene: QrScene, options: PdfOptions = {}): Promise<Buffer> {
  const dpi = options.dpi ?? 300;
  const widthPt = (scene.width / dpi) * 72;
  const heightPt = (scene.height / dpi) * 72;
  const svg = renderSceneToSvg(scene, { title: options.title });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      ...(options.title ? { info: { Title: options.title } } : {}),
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      SVGtoPDF(doc, svg, 0, 0, { width: widthPt, height: heightPt, preserveAspectRatio: 'xMidYMid meet' });
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
