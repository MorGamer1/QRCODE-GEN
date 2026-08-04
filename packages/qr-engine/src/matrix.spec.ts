import { ErrorCorrectionLevel } from '@qrgen/shared';
import { encodeMatrix, getFinderPatternRegions, isInFinderRegion } from './matrix';

describe('encodeMatrix', () => {
  it('encodes short text at the smallest version (21x21)', () => {
    const matrix = encodeMatrix('HI', ErrorCorrectionLevel.M);
    expect(matrix.version).toBe(1);
    expect(matrix.size).toBe(21);
  });

  it('produces a larger matrix for longer content', () => {
    const long = 'https://example.com/' + 'x'.repeat(300);
    const matrix = encodeMatrix(long, ErrorCorrectionLevel.M);
    expect(matrix.size).toBeGreaterThan(21);
  });

  it('requires a bigger (or equal) matrix at higher error correction for the same content', () => {
    const text = 'https://example.com/product/12345?utm_source=flyer';
    const low = encodeMatrix(text, ErrorCorrectionLevel.L);
    const high = encodeMatrix(text, ErrorCorrectionLevel.H);
    expect(high.version).toBeGreaterThanOrEqual(low.version);
  });

  it('isDark returns false outside the matrix bounds', () => {
    const matrix = encodeMatrix('HI', ErrorCorrectionLevel.M);
    expect(matrix.isDark(-1, 0)).toBe(false);
    expect(matrix.isDark(0, -1)).toBe(false);
    expect(matrix.isDark(matrix.size, 0)).toBe(false);
    expect(matrix.isDark(0, matrix.size)).toBe(false);
  });

  it('always marks the three finder-pattern corners as dark at their (0,0) module', () => {
    const matrix = encodeMatrix('https://example.com', ErrorCorrectionLevel.M);
    for (const region of getFinderPatternRegions(matrix.size)) {
      expect(matrix.isDark(region.row, region.col)).toBe(true);
    }
  });
});

describe('getFinderPatternRegions', () => {
  it('returns exactly the three fixed corner regions for a given size', () => {
    const regions = getFinderPatternRegions(21);
    expect(regions).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 14 },
      { row: 14, col: 0 },
    ]);
  });
});

describe('isInFinderRegion', () => {
  it('is true for every cell inside the 7x7 top-left block', () => {
    expect(isInFinderRegion(0, 0, 21)).toBe(true);
    expect(isInFinderRegion(6, 6, 21)).toBe(true);
  });

  it('is false just outside the 7x7 top-left block', () => {
    expect(isInFinderRegion(7, 0, 21)).toBe(false);
    expect(isInFinderRegion(0, 7, 21)).toBe(false);
  });

  it('is false in the middle of the matrix, away from all three corners', () => {
    expect(isInFinderRegion(10, 10, 21)).toBe(false);
  });
});
