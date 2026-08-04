'use client';

import { Controller, useFormContext } from 'react-hook-form';
import type { LogoOptions } from '@qrgen/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FileUploadField } from '../file-upload-field';
import { ColorInput } from './color-input';

const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const LOGO_MAX_SIZE = 5 * 1024 * 1024;

const DEFAULT_LOGO: LogoOptions = {
  fileId: null,
  sizeRatio: 0.2,
  padding: 8,
  backgroundColor: '#FFFFFF',
  borderRadius: 0,
  rotation: 0,
  excavate: true,
};

export function LogoEditor({
  onPreviewLogoChange,
}: {
  onPreviewLogoChange: (dataUri: string | null) => void;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name="design.logo"
      control={control}
      render={({ field }) => {
        const logo: LogoOptions | null = field.value ?? null;

        if (!logo) {
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.onChange(DEFAULT_LOGO)}
            >
              Add a logo
            </Button>
          );
        }

        const update = (patch: Partial<LogoOptions>) => field.onChange({ ...logo, ...patch });

        return (
          <div className="space-y-4 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Logo</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  field.onChange(null);
                  onPreviewLogoChange(null);
                }}
              >
                Remove
              </Button>
            </div>

            <FileUploadField
              purpose="logo"
              accept={LOGO_MIME_TYPES}
              maxSizeBytes={LOGO_MAX_SIZE}
              value={logo.fileId}
              helperText="PNG, JPEG, WebP or SVG, up to 5MB"
              onChange={(fileId, meta) => {
                update({ fileId });
                onPreviewLogoChange(meta?.dataUri ?? null);
              }}
            />

            <SliderField
              label="Size"
              value={logo.sizeRatio * 100}
              min={5}
              max={40}
              unit="%"
              onChange={(v) => update({ sizeRatio: v / 100 })}
            />
            <SliderField
              label="Padding"
              value={logo.padding}
              min={0}
              max={30}
              unit="%"
              onChange={(v) => update({ padding: v })}
            />
            <SliderField
              label="Corner rounding"
              value={logo.borderRadius}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => update({ borderRadius: v })}
            />
            <SliderField
              label="Rotation"
              value={logo.rotation}
              min={0}
              max={360}
              unit="°"
              onChange={(v) => update({ rotation: v })}
            />

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="logo-bg" className="text-sm font-normal">
                Background
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="logo-bg-transparent"
                  checked={logo.backgroundColor === null}
                  onCheckedChange={(checked) =>
                    update({ backgroundColor: checked ? null : '#FFFFFF' })
                  }
                />
                <Label
                  htmlFor="logo-bg-transparent"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Transparent
                </Label>
              </div>
            </div>
            {logo.backgroundColor !== null && (
              <ColorInput
                id="logo-bg"
                value={logo.backgroundColor}
                onChange={(color) => update({ backgroundColor: color })}
              />
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="logo-excavate"
                checked={logo.excavate}
                onCheckedChange={(checked) => update({ excavate: Boolean(checked) })}
              />
              <Label htmlFor="logo-excavate" className="text-sm font-normal">
                Remove QR modules behind the logo
              </Label>
            </div>
          </div>
        );
      }}
    />
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} onValueChange={([v = value]) => onChange(v)} />
    </div>
  );
}
