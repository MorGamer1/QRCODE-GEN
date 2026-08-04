'use client';

import * as React from 'react';
import Link from 'next/link';
import { BarChart3, MousePointerClick, QrCode, Eye } from 'lucide-react';
import { useAnalyticsOverview } from '@/hooks/use-analytics';
import { resolveRangePreset, type RangePreset } from '@/lib/date-range-presets';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RangeSelect } from '@/components/analytics/range-select';
import { ScanTimeseriesChart } from '@/components/analytics/scan-timeseries-chart';

export default function AnalyticsPage() {
  const [preset, setPreset] = React.useState<RangePreset>('30d');
  const range = React.useMemo(() => resolveRangePreset(preset), [preset]);
  const { data, isPending } = useAnalyticsOverview(range);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Scan activity across every QR code in your account.</p>
        </div>
        <RangeSelect value={preset} onChange={setPreset} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={MousePointerClick} label="Total scans" value={data?.totalScans} loading={isPending} />
        <StatCard icon={Eye} label="Unique scans" value={data?.totalUniqueScans} loading={isPending} />
        <StatCard icon={QrCode} label="QR codes" value={data?.totalQrCodes} loading={isPending} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan trend</CardTitle>
        </CardHeader>
        <CardContent>{isPending ? <Skeleton className="h-72 w-full" /> : <ScanTimeseriesChart data={data?.timeseries ?? []} />}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top QR codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending && <Skeleton className="h-48 w-full" />}
          {!isPending && (data?.topQrCodes.length ?? 0) === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <BarChart3 className="h-8 w-8" />
              <p className="text-sm">No scan activity yet.</p>
            </div>
          )}
          {!isPending && data && data.topQrCodes.length > 0 && (
            <div className="divide-y">
              {data.topQrCodes.map((qr, i) => (
                <Link
                  key={qr.id}
                  href={`/dashboard/qr-codes/${qr.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/50"
                >
                  <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-medium">{qr.name}</span>
                  <span className="text-sm text-muted-foreground">{formatNumber(qr.totalScans)} scans</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-semibold leading-none">{formatNumber(value ?? 0)}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
