import QRCode from 'qrcode';
import { ErrorCorrectionLevel } from '@qrgen/shared';

export interface QrMatrix {
  size: number;
  version: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  isDark(row: number, col: number): boolean;
}

/**
 * Encodes raw text into a QR matrix. Delegates the actual encoding math
 * (Reed-Solomon error correction, mask selection, segment mode detection) to
 * the battle-tested `qrcode` package - reinventing that from scratch would
 * add risk with no product value. Everything downstream of this (styling,
 * eyes, gradients, logos, frames, raster/vector export) is custom.
 */
export function encodeMatrix(
  text: string,
  errorCorrectionLevel: ErrorCorrectionLevel = ErrorCorrectionLevel.M,
): QrMatrix {
  const encoded = QRCode.create(text, {
    errorCorrectionLevel,
  });
  const { size, data } = encoded.modules;

  return {
    size,
    version: encoded.version,
    errorCorrectionLevel,
    isDark(row: number, col: number): boolean {
      if (row < 0 || col < 0 || row >= size || col >= size) return false;
      return data[row * size + col] === 1;
    },
  };
}

/** The three 7x7 finder-pattern (eye) regions, fixed for every QR version. */
export function getFinderPatternRegions(size: number): Array<{ row: number; col: number }> {
  return [
    { row: 0, col: 0 }, // top-left
    { row: 0, col: size - 7 }, // top-right
    { row: size - 7, col: 0 }, // bottom-left
  ];
}

export function isInFinderRegion(row: number, col: number, size: number): boolean {
  return getFinderPatternRegions(size).some(
    (r) => row >= r.row && row < r.row + 7 && col >= r.col && col < r.col + 7,
  );
}
