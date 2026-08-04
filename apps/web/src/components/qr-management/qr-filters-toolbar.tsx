'use client';

import * as React from 'react';
import { Search, Star } from 'lucide-react';
import { ContentType, QrCodeType } from '@qrgen/shared';
import { useCategories } from '@/hooks/use-categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTENT_TYPE_LABELS } from './content-type-labels';

export interface QrFilters {
  search: string;
  categoryId: string | undefined;
  type: QrCodeType | undefined;
  contentType: ContentType | undefined;
  isFavorite: boolean | undefined;
  isArchived: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'totalScans' | 'lastScannedAt';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: QrFilters = {
  search: '',
  categoryId: undefined,
  type: undefined,
  contentType: undefined,
  isFavorite: undefined,
  isArchived: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const ALL_VALUE = '__all__';
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'totalScans:desc', label: 'Most scanned' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'lastScannedAt:desc', label: 'Recently scanned' },
];

export function QrFiltersToolbar({ filters, onChange }: { filters: QrFilters; onChange: (filters: QrFilters) => void }) {
  const { data: categories } = useCategories();
  const [searchDraft, setSearchDraft] = React.useState(filters.search);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== filters.search) onChange({ ...filters, search: searchDraft });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Search by name or notes"
          className="pl-8"
        />
      </div>

      <Select
        value={filters.categoryId ?? ALL_VALUE}
        onValueChange={(v) => onChange({ ...filters, categoryId: v === ALL_VALUE ? undefined : v })}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All categories</SelectItem>
          {categories?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type ?? ALL_VALUE} onValueChange={(v) => onChange({ ...filters, type: v === ALL_VALUE ? undefined : (v as QrCodeType) })}>
        <SelectTrigger className="sm:w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All types</SelectItem>
          <SelectItem value={QrCodeType.DYNAMIC}>Dynamic</SelectItem>
          <SelectItem value={QrCodeType.STATIC}>Static</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.contentType ?? ALL_VALUE}
        onValueChange={(v) => onChange({ ...filters, contentType: v === ALL_VALUE ? undefined : (v as ContentType) })}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Content" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All content</SelectItem>
          {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={`${filters.sortBy}:${filters.sortOrder}`}
        onValueChange={(v) => {
          const [sortBy, sortOrder] = v.split(':') as [QrFilters['sortBy'], QrFilters['sortOrder']];
          onChange({ ...filters, sortBy, sortOrder });
        }}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={filters.isFavorite ? 'default' : 'outline'}
        size="icon"
        onClick={() => onChange({ ...filters, isFavorite: filters.isFavorite ? undefined : true })}
        aria-label="Show favorites only"
      >
        <Star className={filters.isFavorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
      </Button>

      <Button type="button" variant={filters.isArchived ? 'default' : 'outline'} size="sm" onClick={() => onChange({ ...filters, isArchived: !filters.isArchived })}>
        {filters.isArchived ? 'Showing archived' : 'Show archived'}
      </Button>
    </div>
  );
}
