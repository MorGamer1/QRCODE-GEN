'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RANGE_PRESET_OPTIONS, type RangePreset } from '@/lib/date-range-presets';

export function RangeSelect({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (preset: RangePreset) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangePreset)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_PRESET_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
