'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useQrScans, scanExportUrl } from '@/hooks/use-analytics';
import type { ResolvedRange } from '@/lib/date-range-presets';
import { formatDateTime } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ScanListTable({ qrId, range }: { qrId: string; range: ResolvedRange }) {
  const [page, setPage] = React.useState(1);
  const { data, isPending } = useQrScans(qrId, range, page);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Recent scans</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={scanExportUrl(qrId, range, 'csv')}>CSV</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={scanExportUrl(qrId, range, 'json')}>JSON</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}

      {!isPending && (data?.items.length ?? 0) === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No scans in this period yet.</p>
      )}

      {!isPending && (data?.items.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>Referrer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(scan.scannedAt)}
                    {scan.isUnique && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Unique
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{[scan.city, scan.country].filter(Boolean).join(', ') || 'Unknown'}</TableCell>
                  <TableCell className="text-xs">{[scan.deviceType, scan.os].filter(Boolean).join(' / ') || 'Unknown'}</TableCell>
                  <TableCell className="text-xs">{scan.browser ?? 'Unknown'}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{scan.referrer || 'Direct'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
