'use client';

import * as React from 'react';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';
import type { QrDesign } from '@qrgen/shared';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrLivePreviewProps {
  text: string;
  design: QrDesign;
  logoDataUri?: string | null;
  className?: string;
}

const TRANSPARENT_CHECKERBOARD =
  'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)';

export function QrLivePreview({ text, design, logoDataUri, className }: QrLivePreviewProps) {
  const deferredText = React.useDeferredValue(text);
  const deferredDesign = React.useDeferredValue(design);
  const deferredLogo = React.useDeferredValue(logoDataUri);

  const svg = React.useMemo(() => {
    if (!deferredText) return null;
    try {
      const scene = buildQrScene(deferredText, deferredDesign, { logoDataUri: deferredLogo });
      return renderSceneToSvg(scene);
    } catch {
      return undefined;
    }
  }, [deferredText, deferredDesign, deferredLogo]);

  const isTransparent = design.backgroundFill === null;

  return (
    <div
      className={cn(
        'flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border p-4',
        className,
      )}
      style={
        isTransparent
          ? { backgroundImage: TRANSPARENT_CHECKERBOARD, backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }
          : undefined
      }
    >
      {svg === undefined ? (
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-xs">Couldn&apos;t render a preview with the current settings</p>
        </div>
      ) : svg === null ? (
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
          <p className="text-sm">Fill in the content to see your QR code</p>
        </div>
      ) : (
        <div
          className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          role="img"
          aria-label="Live QR code preview"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
