'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { ShapeOption } from './shape-options';

export function ShapePicker({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: ShapeOption[];
}) {
  const { control } = useFormContext();
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-4 gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => field.onChange(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors',
                  field.value === opt.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:border-primary/40',
                )}
              >
                <span className={cn('h-6 w-6 bg-foreground', opt.previewClassName)} />
                <span className="text-center text-[11px] leading-tight text-muted-foreground">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        )}
      />
    </div>
  );
}
