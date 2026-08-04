'use client';

import * as React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import type { BreakdownRow } from '@/lib/qr-types';
import { ChartEmptyState } from './chart-empty-state';

countries.registerLocale(enLocale);

// Bundled locally (packages/../public/map) rather than fetched from a CDN, so the map keeps
// working in fully self-hosted/offline deployments.
const GEO_URL = '/map/countries-110m.json';

export function ScanWorldMap({ rows }: { rows: BreakdownRow[] }) {
  const { countsByNumericId, max } = React.useMemo(() => {
    const map = new Map<string, { code: string; count: number }>();
    let maxCount = 0;
    for (const row of rows) {
      const numeric = countries.alpha2ToNumeric(row.value.toUpperCase());
      if (!numeric) continue;
      map.set(numeric, { code: row.value, count: row.count });
      maxCount = Math.max(maxCount, row.count);
    }
    return { countsByNumericId: map, max: maxCount };
  }, [rows]);

  if (countsByNumericId.size === 0) return <ChartEmptyState message="No location data for this period yet" />;

  return (
    <div className="space-y-2">
      <ComposableMap projectionConfig={{ scale: 140 }} width={800} height={420} style={{ width: '100%', height: 'auto' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties: { name?: string } }> }) =>
            geographies.map((geo) => {
              const match = countsByNumericId.get(geo.id);
              const count = match?.count ?? 0;
              const opacity = count > 0 ? 0.2 + 0.8 * (count / max) : 0;
              const name = countries.getName(match?.code.toUpperCase() ?? '', 'en') ?? geo.properties.name ?? 'Unknown';
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: count > 0 ? `hsl(var(--chart-1) / ${opacity})` : 'hsl(var(--muted))',
                      stroke: 'hsl(var(--border))',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: count > 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--muted))',
                      stroke: 'hsl(var(--border))',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                >
                  <title>{`${name}: ${count.toLocaleString()} scan${count === 1 ? '' : 's'}`}</title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Fewer</span>
        <div className="flex h-2.5 w-24 overflow-hidden rounded-full">
          {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
            <span key={o} className="flex-1" style={{ backgroundColor: `hsl(var(--chart-1) / ${o})` }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
