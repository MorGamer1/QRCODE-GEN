'use client';

import { useFormContext } from 'react-hook-form';
import { QR_DESIGN_PRESETS } from '@qrgen/shared';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';

const SAMPLE_TEXT = 'https://qrgen.app';

// Presets are static, so their preview SVGs are computed once at module load rather than on
// every render of the picker.
const PRESET_PREVIEWS = QR_DESIGN_PRESETS.map((preset) => ({
  ...preset,
  svg: renderSceneToSvg(buildQrScene(SAMPLE_TEXT, { ...preset.design, size: 160, margin: 2 })),
}));

export function DesignPresets() {
  const { watch, setValue } = useFormContext();
  const current = watch('design');

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {PRESET_PREVIEWS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() =>
            setValue(
              'design',
              {
                ...preset.design,
                size: current?.size ?? preset.design.size,
                margin: current?.margin ?? preset.design.margin,
                logo: current?.logo ?? null,
                frame: current?.frame ?? null,
              },
              { shouldDirty: true },
            )
          }
          className="flex flex-col items-center gap-1.5"
        >
          <span
            className="h-14 w-14 overflow-hidden rounded-md border bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: preset.svg }}
          />
          <span className="text-[11px] text-muted-foreground">{preset.label}</span>
        </button>
      ))}
    </div>
  );
}
