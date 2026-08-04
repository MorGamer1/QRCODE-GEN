import { RANGE_PRESET_OPTIONS, resolveRangePreset } from './date-range-presets';

describe('resolveRangePreset', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('7d resolves to a 7-day window with day granularity', () => {
    const result = resolveRangePreset('7d');
    expect(result.to).toBe(now.toISOString());
    expect(new Date(result.from)).toEqual(new Date(now.getTime() - 7 * 86_400_000));
    expect(result.granularity).toBe('day');
  });

  it('30d resolves to a 30-day window with day granularity', () => {
    const result = resolveRangePreset('30d');
    expect(new Date(result.from)).toEqual(new Date(now.getTime() - 30 * 86_400_000));
    expect(result.granularity).toBe('day');
  });

  it('90d switches to week granularity', () => {
    expect(resolveRangePreset('90d').granularity).toBe('week');
  });

  it('12m resolves to roughly a year with month granularity', () => {
    const result = resolveRangePreset('12m');
    expect(new Date(result.from)).toEqual(new Date(now.getTime() - 365 * 86_400_000));
    expect(result.granularity).toBe('month');
  });

  it('all resolves from the Unix epoch', () => {
    const result = resolveRangePreset('all');
    expect(result.from).toBe(new Date(0).toISOString());
    expect(result.granularity).toBe('month');
  });

  it('every preset produces a "from" strictly before "to"', () => {
    for (const { value } of RANGE_PRESET_OPTIONS) {
      const { from, to } = resolveRangePreset(value);
      expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
    }
  });
});

describe('RANGE_PRESET_OPTIONS', () => {
  it('every option has a resolvable preset value', () => {
    for (const { value } of RANGE_PRESET_OPTIONS) {
      expect(() => resolveRangePreset(value)).not.toThrow();
    }
  });
});
