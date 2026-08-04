import { describe, expect, it, vi } from 'vitest';
import { cn, formatDate, formatDateTime, formatNumber, formatRelativeTime } from './utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('resolves conflicting Tailwind utilities to the last one (tailwind-merge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatNumber', () => {
  it('formats small numbers with grouping, not compact notation', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('switches to compact notation at 100,000+', () => {
    expect(formatNumber(150_000)).toBe('150K');
  });

  it('does not use compact notation just under the threshold', () => {
    expect(formatNumber(99_999)).toBe('99,999');
  });
});

describe('formatDate / formatDateTime', () => {
  it('accepts both a Date and an ISO string and produces the same output', () => {
    const iso = '2026-03-15T10:00:00.000Z';
    expect(formatDate(iso)).toBe(formatDate(new Date(iso)));
  });

  it('formatDateTime includes a time component that formatDate omits', () => {
    const iso = '2026-03-15T10:30:00.000Z';
    expect(formatDateTime(iso)).not.toBe(formatDate(iso));
    expect(formatDateTime(iso).length).toBeGreaterThan(formatDate(iso).length);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats a few minutes in the past', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('formats a future time', () => {
    const inTwoHours = new Date(now.getTime() + 2 * 3_600_000);
    expect(formatRelativeTime(inTwoHours)).toBe('in 2 hours');
  });

  it('falls back to seconds for very recent timestamps', () => {
    const justNow = new Date(now.getTime() - 10_000);
    expect(formatRelativeTime(justNow)).toBe('10 seconds ago');
  });

  it('formats days correctly', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });
});
