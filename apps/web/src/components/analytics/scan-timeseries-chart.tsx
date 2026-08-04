'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeseriesPoint } from '@/lib/qr-types';
import { ChartTooltip } from './chart-tooltip';
import { ChartEmptyState } from './chart-empty-state';

export function ScanTimeseriesChart({ data }: { data: TimeseriesPoint[] }) {
  const hasScans = data.some((d) => d.totalScans > 0);
  if (!hasScans) return <ChartEmptyState message="No scans in this period yet" />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="totalScansGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="totalScans"
          name="Total scans"
          stroke="hsl(var(--chart-1))"
          fill="url(#totalScansGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="uniqueScans"
          name="Unique scans"
          stroke="hsl(var(--chart-2))"
          fill="transparent"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
