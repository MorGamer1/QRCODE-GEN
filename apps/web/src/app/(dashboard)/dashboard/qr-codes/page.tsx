'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, QrCode as QrCodeIcon } from 'lucide-react';
import { useQrCodes } from '@/hooks/use-qr-codes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCard } from '@/components/qr-management/qr-card';
import {
  QrFiltersToolbar,
  DEFAULT_FILTERS,
  type QrFilters,
} from '@/components/qr-management/qr-filters-toolbar';
import { BulkActionsBar } from '@/components/qr-management/bulk-actions-bar';

const PAGE_SIZE = 24;

export default function QrCodesPage() {
  const [filters, setFilters] = React.useState<QrFilters>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const query = useQrCodes({
    page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    categoryId: filters.categoryId,
    type: filters.type,
    contentType: filters.contentType,
    isFavorite: filters.isFavorite,
    isArchived: filters.isArchived,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const handleFiltersChange = (next: QrFilters) => {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  };

  const items = query.data?.items ?? [];
  const allSelected = items.length > 0 && items.every((qr) => selectedIds.includes(qr.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds((ids) => ids.filter((id) => !items.some((qr) => qr.id === id)));
    else setSelectedIds((ids) => Array.from(new Set([...ids, ...items.map((qr) => qr.id)])));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">QR Codes</h1>
          <p className="text-sm text-muted-foreground">
            {query.data
              ? `${query.data.total} QR code${query.data.total === 1 ? '' : 's'}`
              : 'Manage your QR codes'}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qr-codes/new">
            <Plus className="h-4 w-4" /> Create QR code
          </Link>
        </Button>
      </div>

      <QrFiltersToolbar filters={filters} onChange={handleFiltersChange} />

      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all on page"
          />
          <span className="text-sm text-muted-foreground">Select all on this page</span>
        </div>
      )}

      <BulkActionsBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />

      {query.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}

      {!query.isPending && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <QrCodeIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No QR codes found</p>
            <p className="text-sm text-muted-foreground">
              {filters.search ||
              filters.categoryId ||
              filters.type ||
              filters.contentType ||
              filters.isFavorite
                ? 'Try adjusting your filters.'
                : 'Create your first QR code to get started.'}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/qr-codes/new">
              <Plus className="h-4 w-4" /> Create QR code
            </Link>
          </Button>
        </div>
      )}

      {!query.isPending && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((qr) => (
            <QrCard
              key={qr.id}
              qr={qr}
              selected={selectedIds.includes(qr.id)}
              onSelectChange={(selected) =>
                setSelectedIds((ids) =>
                  selected ? [...ids, qr.id] : ids.filter((id) => id !== qr.id),
                )
              }
            />
          ))}
        </div>
      )}

      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {query.data.page} of {query.data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= query.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
