'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQrBreakdown } from '@/hooks/use-analytics';
import type { ResolvedRange } from '@/lib/date-range-presets';
import type { BreakdownDimension } from '@/lib/qr-types';
import { BreakdownBarChart } from './breakdown-bar-chart';
import { ScanWorldMap } from './scan-world-map';

const DIMENSIONS: { value: BreakdownDimension; label: string }[] = [
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
  { value: 'deviceType', label: 'Device' },
  { value: 'os', label: 'OS' },
  { value: 'browser', label: 'Browser' },
  { value: 'language', label: 'Language' },
  { value: 'referrer', label: 'Referrer' },
];

export function BreakdownTabs({ qrId, range }: { qrId: string; range: ResolvedRange }) {
  return (
    <Tabs defaultValue="country">
      <TabsList className="h-auto flex-wrap justify-start">
        {DIMENSIONS.map((d) => (
          <TabsTrigger key={d.value} value={d.value}>
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {DIMENSIONS.map((d) => (
        <TabsContent key={d.value} value={d.value}>
          <BreakdownPanel
            qrId={qrId}
            dimension={d.value}
            range={range}
            showMap={d.value === 'country'}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function BreakdownPanel({
  qrId,
  dimension,
  range,
  showMap,
}: {
  qrId: string;
  dimension: BreakdownDimension;
  range: ResolvedRange;
  showMap: boolean;
}) {
  const { data, isPending } = useQrBreakdown(qrId, dimension, range);

  if (isPending) return <Skeleton className="h-64 w-full" />;

  return (
    <div className={showMap ? 'grid gap-6 lg:grid-cols-2' : ''}>
      {showMap && <ScanWorldMap rows={data ?? []} />}
      <BreakdownBarChart rows={data ?? []} />
    </div>
  );
}
