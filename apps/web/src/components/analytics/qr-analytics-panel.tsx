'use client';

import * as React from 'react';
import { Eye, MousePointerClick } from 'lucide-react';
import { useQrTimeseries } from '@/hooks/use-analytics';
import { resolveRangePreset, type RangePreset } from '@/lib/date-range-presets';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RangeSelect } from './range-select';
import { ScanTimeseriesChart } from './scan-timeseries-chart';
import { BreakdownTabs } from './breakdown-tabs';
import { ScanListTable } from './scan-list-table';

export function QrAnalyticsPanel({
  qrId,
  totalScans,
  uniqueScans,
}: {
  qrId: string;
  totalScans: number;
  uniqueScans: number;
}) {
  const [preset, setPreset] = React.useState<RangePreset>('30d');
  const range = React.useMemo(() => resolveRangePreset(preset), [preset]);
  const timeseries = useQrTimeseries(qrId, range);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle>Analytics</CardTitle>
        <RangeSelect value={preset} onChange={setPreset} />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:w-80">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold leading-none">{formatNumber(totalScans)}</p>
              <p className="text-xs text-muted-foreground">Total scans</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold leading-none">{formatNumber(uniqueScans)}</p>
              <p className="text-xs text-muted-foreground">Unique scans</p>
            </div>
          </div>
        </div>

        {timeseries.isPending ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ScanTimeseriesChart data={timeseries.data ?? []} />
        )}

        <BreakdownTabs qrId={qrId} range={range} />

        <ScanListTable qrId={qrId} range={range} />
      </CardContent>
    </Card>
  );
}
