'use client';

import { Input } from '@/components/ui/input';

export function ColorInput({ value, onChange, id }: { value: string; onChange: (value: string) => void; id?: string }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -left-1 -top-1 h-11 w-11 cursor-pointer border-0 p-0"
        />
      </label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="font-mono" />
    </div>
  );
}
