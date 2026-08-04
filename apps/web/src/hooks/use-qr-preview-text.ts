'use client';

import * as React from 'react';
import {
  ContentType,
  QrCodeType,
  buildRedirectUrl,
  contentSchemaMap,
  encodeStaticContent,
} from '@qrgen/shared';

const PLACEHOLDER_SHORT_CODE = 'XXXXXXX';

// contentType is a runtime value here (the user's current selection), not a literal the
// compiler can narrow to a single overload, so the schema map lookup and the encoder call
// both need an escape hatch - safe, because both are keyed off the same contentType at runtime.
const encode = encodeStaticContent as (type: ContentType, payload: unknown) => string;

/**
 * Text that will actually be embedded in the QR image. For dynamic codes that's always the
 * short redirect URL (real once saved, a representative placeholder before that) - editing
 * content never changes the printed code. For static codes it's the live-encoded payload,
 * only once the in-progress form data actually satisfies that content type's schema.
 */
export function useQrPreviewText(
  type: QrCodeType,
  contentType: ContentType,
  data: unknown,
  existingEncodedPayload?: string | null,
): { text: string; isPlaceholder: boolean } {
  return React.useMemo(() => {
    if (type === QrCodeType.DYNAMIC) {
      if (existingEncodedPayload) return { text: existingEncodedPayload, isPlaceholder: false };
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
      return { text: buildRedirectUrl(origin, PLACEHOLDER_SHORT_CODE), isPlaceholder: true };
    }

    const schema = contentSchemaMap[contentType];
    const result = schema.safeParse(data);
    if (!result.success) return { text: '', isPlaceholder: true };
    try {
      return { text: encode(contentType, result.data), isPlaceholder: false };
    } catch {
      return { text: '', isPlaceholder: true };
    }
  }, [type, contentType, data, existingEncodedPayload]);
}
