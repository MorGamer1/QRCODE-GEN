import { insetRadii, roundedRectPath, ringPath, uniformRadii, ZERO_RADII } from './geometry';

describe('uniformRadii', () => {
  it('applies the same radius to all four corners', () => {
    expect(uniformRadii(5)).toEqual({ tl: 5, tr: 5, br: 5, bl: 5 });
  });
});

describe('insetRadii', () => {
  it('reduces every corner by the given amount, clamped at zero', () => {
    expect(insetRadii({ tl: 10, tr: 4, br: 0, bl: 2 }, 3)).toEqual({ tl: 7, tr: 1, br: 0, bl: 0 });
  });
});

describe('roundedRectPath', () => {
  it('starts and ends at the same point (closed path)', () => {
    const d = roundedRectPath(0, 0, 10, 10, uniformRadii(2));
    expect(d.startsWith('M 2 0')).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
  });

  it('omits arc commands entirely for a square (zero radius)', () => {
    const d = roundedRectPath(0, 0, 10, 10, ZERO_RADII);
    expect(d).not.toContain('A ');
    expect(d).toBe('M 0 0 L 10 0 L 10 10 L 0 10 L 0 0 Z');
  });

  it('clamps radii that would exceed half the width/height', () => {
    const d = roundedRectPath(0, 0, 10, 10, uniformRadii(100));
    // clamped to w/2 = 5, so the top edge collapses to a single point at x=5
    expect(d).toContain('M 5 0');
  });

  it('produces exactly 4 arc commands for a fully rounded rect', () => {
    const d = roundedRectPath(0, 0, 10, 10, uniformRadii(3));
    const arcs = d.match(/A /g) ?? [];
    expect(arcs).toHaveLength(4);
  });
});

describe('ringPath', () => {
  it('produces two closed subpaths (outer + inner) for evenodd fill', () => {
    const d = ringPath(0, 0, 20, 2, ZERO_RADII, ZERO_RADII);
    const closes = d.match(/Z/g) ?? [];
    expect(closes).toHaveLength(2);
  });
});
