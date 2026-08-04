'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { FrameStyle, type FrameOptions } from '@qrgen/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorInput } from './color-input';

const FRAME_STYLE_OPTIONS = [
  { value: FrameStyle.NONE, label: 'None' },
  { value: FrameStyle.BOTTOM_LABEL, label: 'Bottom label' },
  { value: FrameStyle.TOP_LABEL, label: 'Top label' },
  { value: FrameStyle.BANNER, label: 'Banner' },
  { value: FrameStyle.ROUNDED_BORDER, label: 'Rounded border' },
];

const DEFAULT_FRAME: FrameOptions = {
  style: FrameStyle.BOTTOM_LABEL,
  text: 'SCAN ME',
  textColor: '#FFFFFF',
  color: '#000000',
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
};

export function FrameEditor() {
  const { control } = useFormContext();

  return (
    <Controller
      name="design.frame"
      control={control}
      render={({ field }) => {
        const frame: FrameOptions | null = field.value ?? null;
        const style = frame?.style ?? FrameStyle.NONE;

        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm font-medium">Frame</span>
              <Select
                value={style}
                onValueChange={(value) => {
                  if (value === FrameStyle.NONE) {
                    field.onChange(null);
                    return;
                  }
                  field.onChange({ ...(frame ?? DEFAULT_FRAME), style: value as FrameStyle });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frame && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="frame-text" className="text-sm font-normal">
                    Label text
                  </Label>
                  <Input
                    id="frame-text"
                    maxLength={60}
                    value={frame.text}
                    onChange={(e) => field.onChange({ ...frame, text: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Frame color</Label>
                    <ColorInput value={frame.color} onChange={(color) => field.onChange({ ...frame, color })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Text color</Label>
                    <ColorInput value={frame.textColor} onChange={(textColor) => field.onChange({ ...frame, textColor })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
