'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { GradientType, type Fill } from '@qrgen/shared';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ColorInput } from './color-input';

const SOLID_DEFAULT: Fill = { mode: 'solid', color: '#000000' };
const GRADIENT_DEFAULT: Fill = {
  mode: 'gradient',
  gradient: {
    type: GradientType.LINEAR,
    rotation: 45,
    stops: [
      { offset: 0, color: '#2563EB' },
      { offset: 1, color: '#7C3AED' },
    ],
  },
};

interface FillPickerProps {
  name: string;
  label: string;
  nullable?: boolean;
  nullLabel?: string;
}

export function FillPicker({ name, label, nullable, nullLabel = 'None' }: FillPickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value: Fill | null = field.value ?? null;
        const mode = value === null ? 'none' : value.mode;

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              <div className="inline-flex rounded-md border p-0.5">
                {nullable && (
                  <ModeButton active={mode === 'none'} onClick={() => field.onChange(null)}>
                    {nullLabel}
                  </ModeButton>
                )}
                <ModeButton active={mode === 'solid'} onClick={() => field.onChange(SOLID_DEFAULT)}>
                  Solid
                </ModeButton>
                <ModeButton
                  active={mode === 'gradient'}
                  onClick={() => field.onChange(GRADIENT_DEFAULT)}
                >
                  Gradient
                </ModeButton>
              </div>
            </div>

            {value?.mode === 'solid' && (
              <ColorInput
                value={value.color}
                onChange={(color) => field.onChange({ mode: 'solid', color })}
              />
            )}

            {value?.mode === 'gradient' && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Select
                    value={value.gradient.type}
                    onValueChange={(type) =>
                      field.onChange({
                        ...value,
                        gradient: { ...value.gradient, type: type as GradientType },
                      })
                    }
                  >
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GradientType.LINEAR}>Linear</SelectItem>
                      <SelectItem value={GradientType.RADIAL}>Radial</SelectItem>
                    </SelectContent>
                  </Select>
                  {value.gradient.type === GradientType.LINEAR && (
                    <div className="flex flex-1 items-center gap-2">
                      <Slider
                        value={[value.gradient.rotation]}
                        min={0}
                        max={360}
                        step={5}
                        onValueChange={([rotation]) =>
                          field.onChange({ ...value, gradient: { ...value.gradient, rotation } })
                        }
                      />
                      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                        {value.gradient.rotation}°
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {value.gradient.stops.map((stop, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={i} className="flex items-center gap-2">
                      <ColorInput
                        value={stop.color}
                        onChange={(color) => {
                          const stops = value.gradient.stops.map((s, si) =>
                            si === i ? { ...s, color } : s,
                          );
                          field.onChange({ ...value, gradient: { ...value.gradient, stops } });
                        }}
                      />
                      <Slider
                        className="w-20 shrink-0"
                        value={[Math.round(stop.offset * 100)]}
                        min={0}
                        max={100}
                        onValueChange={([offset = 0]) => {
                          const stops = value.gradient.stops.map((s, si) =>
                            si === i ? { ...s, offset: offset / 100 } : s,
                          );
                          field.onChange({ ...value, gradient: { ...value.gradient, stops } });
                        }}
                      />
                      {value.gradient.stops.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => {
                            const stops = value.gradient.stops.filter((_, si) => si !== i);
                            field.onChange({ ...value, gradient: { ...value.gradient, stops } });
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {value.gradient.stops.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const stops = [...value.gradient.stops, { offset: 1, color: '#000000' }];
                        field.onChange({ ...value, gradient: { ...value.gradient, stops } });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add color stop
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}
