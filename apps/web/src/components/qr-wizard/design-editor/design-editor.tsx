'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { ErrorCorrectionLevel } from '@qrgen/shared';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DesignPresets } from './design-presets';
import { ShapePicker } from './shape-picker';
import { FillPicker } from './fill-picker';
import { LogoEditor } from './logo-editor';
import { FrameEditor } from './frame-editor';
import { MODULE_SHAPE_OPTIONS, EYE_FRAME_SHAPE_OPTIONS, EYE_BALL_SHAPE_OPTIONS } from './shape-options';

const EC_OPTIONS = [
  { value: ErrorCorrectionLevel.L, label: 'Low (~7%)' },
  { value: ErrorCorrectionLevel.M, label: 'Medium (~15%)' },
  { value: ErrorCorrectionLevel.Q, label: 'Quartile (~25%)' },
  { value: ErrorCorrectionLevel.H, label: 'High (~30%)' },
];

export function DesignEditor({ onPreviewLogoChange }: { onPreviewLogoChange: (dataUri: string | null) => void }) {
  const { control, watch } = useFormContext();
  const hasLogo = Boolean(watch('design.logo'));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Presets</h4>
        <DesignPresets />
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-semibold">Shape</h4>
        <ShapePicker name="design.moduleShape" label="Module shape" options={MODULE_SHAPE_OPTIONS} />
        <div className="grid grid-cols-2 gap-4">
          <ShapePicker name="design.eyeFrameShape" label="Eye frame" options={EYE_FRAME_SHAPE_OPTIONS} />
          <ShapePicker name="design.eyeBallShape" label="Eye ball" options={EYE_BALL_SHAPE_OPTIONS} />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-semibold">Colors</h4>
        <FillPicker name="design.moduleFill" label="Modules" />
        <FillPicker name="design.backgroundFill" label="Background" nullable nullLabel="Transparent" />
        <FillPicker name="design.eyeFrameFill" label="Eye frame" nullable nullLabel="Match modules" />
        <FillPicker name="design.eyeBallFill" label="Eye ball" nullable nullLabel="Match modules" />
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-semibold">Size &amp; error correction</h4>
        <Controller
          name="design.size"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>Export size</span>
                <span className="text-xs text-muted-foreground">{field.value}px</span>
              </div>
              <Slider value={[field.value]} min={256} max={4096} step={16} onValueChange={([v]) => field.onChange(v)} />
            </div>
          )}
        />
        <Controller
          name="design.margin"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>Quiet zone</span>
                <span className="text-xs text-muted-foreground">{field.value} modules</span>
              </div>
              <Slider value={[field.value]} min={0} max={12} onValueChange={([v]) => field.onChange(v)} />
            </div>
          )}
        />
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">Error correction</Label>
          <Controller
            name="design.errorCorrectionLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={hasLogo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {hasLogo && <p className="text-xs text-muted-foreground">Locked to High while a logo is set, so the code stays scannable.</p>}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Logo</h4>
        <LogoEditor onPreviewLogoChange={onPreviewLogoChange} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Frame &amp; label</h4>
        <FrameEditor />
      </section>
    </div>
  );
}
