'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BreakdownRow } from '@/lib/qr-types';
import { ChartTooltip } from './chart-tooltip';
import { ChartEmptyState } from './chart-empty-state';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const MAX_ROWS = 8;

export function BreakdownBarChart({ rows, emptyMessage = 'No data for this period yet' }: { rows: BreakdownRow[]; emptyMessage?: string }) {
  if (rows.length === 0) return <ChartEmptyState message={emptyMessage} />;

  const top = rows.slice(0, MAX_ROWS).map((r) => ({ ...r, label: r.value || 'Unknown' }));
  const height = Math.max(160, top.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={top} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" name="Scans" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {top.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
