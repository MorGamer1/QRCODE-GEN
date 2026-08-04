export interface ResolvedRange {
  from: Date;
  to: Date;
}

const DEFAULT_WINDOW_DAYS = 30;

export function resolveDateRange(input: { from?: string; to?: string }): ResolvedRange {
  const to = input.to ? new Date(input.to) : new Date();
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
  return { from, to };
}

export function truncateToUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface DailyPoint {
  date: Date;
  totalScans: number;
  uniqueScans: number;
}

export interface BucketPoint {
  bucket: string;
  totalScans: number;
  uniqueScans: number;
}

/** Re-buckets daily rollup rows into week/month/year points for chart display. */
export function bucketDaily(
  rows: DailyPoint[],
  granularity: 'week' | 'month' | 'year',
): BucketPoint[] {
  const keyFor = (date: Date): string => {
    if (granularity === 'week') return isoWeekKey(date);
    if (granularity === 'month')
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return `${date.getUTCFullYear()}`;
  };

  const buckets = new Map<string, BucketPoint>();
  for (const row of rows) {
    const key = keyFor(row.date);
    const existing = buckets.get(key) ?? { bucket: key, totalScans: 0, uniqueScans: 0 };
    existing.totalScans += row.totalScans;
    existing.uniqueScans += row.uniqueScans;
    buckets.set(key, existing);
  }
  return Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
}
