'use client';

import { CONTENT_TYPE_REGISTRY, type ContentType, type ContentTypeMeta } from '@qrgen/shared';
import { CONTENT_TYPE_ICONS } from '@/lib/content-type-icons';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<ContentTypeMeta['category'], string> = {
  general: 'General',
  contact: 'Contact',
  business: 'Business',
  media: 'Media',
  other: 'Other',
};

const CATEGORY_ORDER: ContentTypeMeta['category'][] = [
  'general',
  'contact',
  'business',
  'media',
  'other',
];

function groupByCategory(): Record<ContentTypeMeta['category'], ContentTypeMeta[]> {
  const groups = { general: [], contact: [], business: [], media: [], other: [] } as Record<
    ContentTypeMeta['category'],
    ContentTypeMeta[]
  >;
  for (const meta of Object.values(CONTENT_TYPE_REGISTRY)) groups[meta.category].push(meta);
  return groups;
}

const GROUPED = groupByCategory();

export function ContentTypePicker({
  value,
  onChange,
}: {
  value: ContentType;
  onChange: (type: ContentType) => void;
}) {
  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => (
        <div key={category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {GROUPED[category].map((meta) => {
              const Icon = CONTENT_TYPE_ICONS[meta.type];
              const active = meta.type === value;
              return (
                <button
                  key={meta.type}
                  type="button"
                  onClick={() => onChange(meta.type)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors',
                    active
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:border-primary/40 hover:bg-accent/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium leading-none">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                  {meta.dynamicOnly && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Dynamic only
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
