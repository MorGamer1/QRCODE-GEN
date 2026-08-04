'use client';

import * as React from 'react';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';
import type { QrCode } from '@/lib/qr-types';
import { cn } from '@/lib/utils';

/** The saved encodedPayload/design are always literal and complete, so unlike the wizard's
 * live preview this needs no placeholder handling - it's exactly what's on the printed code. */
export function QrThumbnail({ qr, className }: { qr: QrCode; className?: string }) {
  const svg = React.useMemo(() => {
    try {
      const scene = buildQrScene(qr.encodedPayload, { ...qr.design, size: 160, margin: 2 });
      return renderSceneToSvg(scene);
    } catch {
      return null;
    }
  }, [qr.encodedPayload, qr.design]);

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-lg border bg-white [&>svg]:h-full [&>svg]:w-full',
        className,
      )}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
