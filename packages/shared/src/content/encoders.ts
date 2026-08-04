import { ContentType } from '../enums';
import type { ContentPayloadMap } from './schemas';

/**
 * Pure encoders that turn a validated content payload into the literal string
 * embedded in a *static* QR code, or the redirect target for *dynamic* QR
 * codes whose content type resolves to an instant redirect (see
 * INSTANT_REDIRECT_CONTENT_TYPES). Kept dependency-free and side-effect-free
 * so they can run identically on the server and in the browser live preview.
 */

function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function escapeWifiText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"');
}

function formatIcsDate(iso: string, allDay: boolean): string {
  const date = new Date(iso);
  if (allDay) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

export function encodeUrl(payload: ContentPayloadMap[ContentType.URL]): string {
  return payload.url;
}

export function encodeText(payload: ContentPayloadMap[ContentType.TEXT]): string {
  return payload.text;
}

export function encodeEmail(payload: ContentPayloadMap[ContentType.EMAIL]): string {
  const params = new URLSearchParams();
  if (payload.subject) params.set('subject', payload.subject);
  if (payload.body) params.set('body', payload.body);
  const query = params.toString();
  return `mailto:${payload.to}${query ? `?${query}` : ''}`;
}

export function encodePhone(payload: ContentPayloadMap[ContentType.PHONE]): string {
  return `tel:${payload.phone}`;
}

export function encodeSms(payload: ContentPayloadMap[ContentType.SMS]): string {
  return `smsto:${payload.phone}:${payload.message ?? ''}`;
}

export function encodeWhatsapp(payload: ContentPayloadMap[ContentType.WHATSAPP]): string {
  const digits = payload.phone.replace(/\D/g, '');
  const params = payload.message ? `?text=${encodeURIComponent(payload.message)}` : '';
  return `https://wa.me/${digits}${params}`;
}

export function encodeWifi(payload: ContentPayloadMap[ContentType.WIFI]): string {
  const type = payload.encryption === 'nopass' ? 'nopass' : payload.encryption;
  const password =
    payload.encryption === 'nopass' ? '' : `P:${escapeWifiText(payload.password ?? '')};`;
  return `WIFI:T:${type};S:${escapeWifiText(payload.ssid)};${password}${
    payload.hidden ? 'H:true;' : ''
  };`;
}

export function encodeVCard(payload: ContentPayloadMap[ContentType.VCARD]): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ');
  lines.push(
    `N:${escapeVCardText(payload.lastName ?? '')};${escapeVCardText(payload.firstName)};;;`,
  );
  lines.push(`FN:${escapeVCardText(fullName)}`);
  if (payload.organization) lines.push(`ORG:${escapeVCardText(payload.organization)}`);
  if (payload.title) lines.push(`TITLE:${escapeVCardText(payload.title)}`);
  if (payload.phone) lines.push(`TEL;TYPE=WORK,VOICE:${payload.phone}`);
  if (payload.mobile) lines.push(`TEL;TYPE=CELL:${payload.mobile}`);
  if (payload.email) lines.push(`EMAIL:${payload.email}`);
  if (payload.website) lines.push(`URL:${payload.website}`);
  if (payload.address || payload.city || payload.postalCode || payload.country) {
    lines.push(
      `ADR;TYPE=WORK:;;${escapeVCardText(payload.address ?? '')};${escapeVCardText(
        payload.city ?? '',
      )};;${escapeVCardText(payload.postalCode ?? '')};${escapeVCardText(payload.country ?? '')}`,
    );
  }
  if (payload.note) lines.push(`NOTE:${escapeVCardText(payload.note)}`);
  if (payload.photoUrl) lines.push(`PHOTO;VALUE=URI:${payload.photoUrl}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function encodeLocation(payload: ContentPayloadMap[ContentType.LOCATION]): string {
  return `geo:${payload.latitude},${payload.longitude}${
    payload.query ? `?q=${encodeURIComponent(payload.query)}` : ''
  }`;
}

export function encodeEvent(payload: ContentPayloadMap[ContentType.EVENT]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QRGen//Event//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${payload.title}`,
    `DTSTART:${formatIcsDate(payload.start, payload.allDay)}`,
  ];
  if (payload.end) lines.push(`DTEND:${formatIcsDate(payload.end, payload.allDay)}`);
  if (payload.location) lines.push(`LOCATION:${payload.location}`);
  if (payload.description) lines.push(`DESCRIPTION:${payload.description.replace(/\n/g, '\\n')}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function encodeCrypto(payload: ContentPayloadMap[ContentType.CRYPTO]): string {
  const scheme = payload.currency.toLowerCase();
  const params = new URLSearchParams();
  if (payload.amount) params.set('amount', String(payload.amount));
  if (payload.message) params.set('message', payload.message);
  const query = params.toString();
  return `${scheme}:${payload.address}${query ? `?${query}` : ''}`;
}

export function encodeSocial(payload: ContentPayloadMap[ContentType.SOCIAL]): string {
  return payload.url;
}

export function resolveAppStoreUrlForPlatform(
  payload: ContentPayloadMap[ContentType.APP_STORE],
  platform: 'ios' | 'android' | 'other',
): string {
  if (platform === 'ios') return payload.iosUrl ?? payload.fallbackUrl ?? payload.androidUrl ?? '';
  if (platform === 'android')
    return payload.androidUrl ?? payload.fallbackUrl ?? payload.iosUrl ?? '';
  return payload.fallbackUrl ?? payload.iosUrl ?? payload.androidUrl ?? '';
}

/**
 * Builds the literal payload that gets embedded in a STATIC QR code image.
 * Content types that only make sense behind a landing page (PDF/IMAGE/CUSTOM
 * with no redirectUrl) fall back to a sensible textual representation.
 */
export function encodeStaticContent<T extends ContentType>(
  type: T,
  payload: ContentPayloadMap[T],
): string {
  switch (type) {
    case ContentType.URL:
      return encodeUrl(payload as ContentPayloadMap[ContentType.URL]);
    case ContentType.TEXT:
      return encodeText(payload as ContentPayloadMap[ContentType.TEXT]);
    case ContentType.EMAIL:
      return encodeEmail(payload as ContentPayloadMap[ContentType.EMAIL]);
    case ContentType.PHONE:
      return encodePhone(payload as ContentPayloadMap[ContentType.PHONE]);
    case ContentType.SMS:
      return encodeSms(payload as ContentPayloadMap[ContentType.SMS]);
    case ContentType.WHATSAPP:
      return encodeWhatsapp(payload as ContentPayloadMap[ContentType.WHATSAPP]);
    case ContentType.WIFI:
      return encodeWifi(payload as ContentPayloadMap[ContentType.WIFI]);
    case ContentType.VCARD:
      return encodeVCard(payload as ContentPayloadMap[ContentType.VCARD]);
    case ContentType.LOCATION:
      return encodeLocation(payload as ContentPayloadMap[ContentType.LOCATION]);
    case ContentType.EVENT:
      return encodeEvent(payload as ContentPayloadMap[ContentType.EVENT]);
    case ContentType.CRYPTO:
      return encodeCrypto(payload as ContentPayloadMap[ContentType.CRYPTO]);
    case ContentType.SOCIAL:
      return encodeSocial(payload as ContentPayloadMap[ContentType.SOCIAL]);
    case ContentType.CUSTOM: {
      const custom = payload as ContentPayloadMap[ContentType.CUSTOM];
      return custom.redirectUrl ?? custom.body ?? custom.title ?? '';
    }
    case ContentType.PDF:
    case ContentType.IMAGE:
    case ContentType.APP_STORE:
      throw new Error(`${type} requires a dynamic QR code (needs a resolvable landing page)`);
    default:
      throw new Error(`Unsupported content type: ${type as string}`);
  }
}
