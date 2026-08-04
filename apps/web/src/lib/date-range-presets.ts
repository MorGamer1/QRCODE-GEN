export type RangePreset = '7d' | '30d' | '90d' | '12m' | 'all';

export interface ResolvedRange {
  from: string;
  to: string;
  granularity: 'day' | 'week' | 'month';
}

export const RANGE_PRESET_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function resolveRangePreset(preset: RangePreset): ResolvedRange {
  const to = new Date().toISOString();
  switch (preset) {
    case '7d':
      return { from: daysAgoIso(7), to, granularity: 'day' };
    case '30d':
      return { from: daysAgoIso(30), to, granularity: 'day' };
    case '90d':
      return { from: daysAgoIso(90), to, granularity: 'week' };
    case '12m':
      return { from: daysAgoIso(365), to, granularity: 'month' };
    case 'all':
      return { from: new Date(0).toISOString(), to, granularity: 'month' };
  }
}
