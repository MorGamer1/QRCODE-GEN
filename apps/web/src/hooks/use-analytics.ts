'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiDownloadUrl } from '@/lib/api-client';
import type { ResolvedRange } from '@/lib/date-range-presets';
import type {
  AnalyticsOverview,
  BreakdownDimension,
  BreakdownRow,
  PaginatedResult,
  QrSummary,
  Scan,
  TimeseriesPoint,
} from '@/lib/qr-types';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export function useAnalyticsOverview(range: ResolvedRange) {
  return useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => api.get<AnalyticsOverview>('/analytics/overview', { ...range } as QueryParams),
  });
}

export function useQrSummary(qrId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'summary', qrId],
    queryFn: () => api.get<QrSummary>(`/analytics/qr/${qrId}/summary`),
    enabled: Boolean(qrId),
  });
}

export function useQrTimeseries(qrId: string | undefined, range: ResolvedRange) {
  return useQuery({
    queryKey: ['analytics', 'timeseries', qrId, range],
    queryFn: () =>
      api.get<TimeseriesPoint[]>(`/analytics/qr/${qrId}/timeseries`, { ...range } as QueryParams),
    enabled: Boolean(qrId),
  });
}

export function useQrBreakdown(
  qrId: string | undefined,
  dimension: BreakdownDimension,
  range: ResolvedRange,
) {
  return useQuery({
    queryKey: ['analytics', 'breakdown', qrId, dimension, range],
    queryFn: () =>
      api.get<BreakdownRow[]>(`/analytics/qr/${qrId}/breakdown`, {
        ...range,
        dimension,
      } as QueryParams),
    enabled: Boolean(qrId),
  });
}

export function useQrScans(
  qrId: string | undefined,
  range: ResolvedRange,
  page: number,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ['analytics', 'scans', qrId, range, page, pageSize],
    queryFn: () =>
      api.get<PaginatedResult<Scan>>(`/analytics/qr/${qrId}/scans`, {
        ...range,
        page,
        pageSize,
      } as QueryParams),
    enabled: Boolean(qrId),
  });
}

export function scanExportUrl(qrId: string, range: ResolvedRange, format: 'csv' | 'json'): string {
  return apiDownloadUrl(`/analytics/qr/${qrId}/export`, { ...range, format } as QueryParams);
}
