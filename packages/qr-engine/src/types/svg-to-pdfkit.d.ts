declare module 'svg-to-pdfkit' {
  import type PDFDocument from 'pdfkit';

  interface SvgToPdfKitOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    useCSS?: boolean;
    fontCallback?: (family: string, bold: boolean, italic: boolean) => string;
    colorCallback?: (color: string) => [string, number] | undefined;
    assumePt?: boolean;
  }

  function SVGtoPDF(
    doc: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: SvgToPdfKitOptions,
  ): void;

  export = SVGtoPDF;
}
