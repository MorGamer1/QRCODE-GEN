import { ContentType } from '../enums';
import {
  encodeCrypto,
  encodeEmail,
  encodeEvent,
  encodeLocation,
  encodePhone,
  encodeSms,
  encodeStaticContent,
  encodeUrl,
  encodeVCard,
  encodeWhatsapp,
  encodeWifi,
  resolveAppStoreUrlForPlatform,
} from './encoders';

describe('encodeUrl / encodeText / encodePhone', () => {
  it('encodeUrl returns the URL verbatim', () => {
    expect(encodeUrl({ url: 'https://example.com' })).toBe('https://example.com');
  });

  it('encodePhone produces a tel: URI', () => {
    expect(encodePhone({ phone: '+14155552671' })).toBe('tel:+14155552671');
  });
});

describe('encodeEmail', () => {
  it('produces a bare mailto: with no query string when subject/body are absent', () => {
    expect(encodeEmail({ to: 'person@example.com' })).toBe('mailto:person@example.com');
  });

  it('appends subject and body as a query string', () => {
    const result = encodeEmail({ to: 'person@example.com', subject: 'Hi', body: 'Hello there' });
    expect(result).toBe('mailto:person@example.com?subject=Hi&body=Hello+there');
  });
});

describe('encodeSms', () => {
  it('uses the smsto: scheme with an empty message when none provided', () => {
    expect(encodeSms({ phone: '+14155552671' })).toBe('smsto:+14155552671:');
  });

  it('includes the message', () => {
    expect(encodeSms({ phone: '+14155552671', message: 'hi' })).toBe('smsto:+14155552671:hi');
  });
});

describe('encodeWhatsapp', () => {
  it('strips non-digit characters from the phone number', () => {
    expect(encodeWhatsapp({ phone: '+1 (415) 555-2671' })).toBe('https://wa.me/14155552671');
  });

  it('URL-encodes the prefilled message', () => {
    expect(encodeWhatsapp({ phone: '+14155552671', message: 'Hello & welcome!' })).toBe(
      'https://wa.me/14155552671?text=Hello%20%26%20welcome!',
    );
  });
});

describe('encodeWifi', () => {
  it('produces a standard WIFI: string for WPA networks', () => {
    expect(
      encodeWifi({ ssid: 'MyNetwork', password: 'hunter2', encryption: 'WPA', hidden: false }),
    ).toBe('WIFI:T:WPA;S:MyNetwork;P:hunter2;;');
  });

  it('omits the password field entirely for open (nopass) networks', () => {
    const result = encodeWifi({ ssid: 'Open', encryption: 'nopass', hidden: false });
    expect(result).toBe('WIFI:T:nopass;S:Open;;');
    expect(result).not.toContain('P:');
  });

  it('adds H:true; for hidden networks', () => {
    expect(
      encodeWifi({ ssid: 'Hidden', encryption: 'WPA', password: 'x', hidden: true }),
    ).toContain('H:true;');
  });

  it('escapes special characters in the SSID and password per the WIFI: QR spec', () => {
    // Un-escaped, a semicolon or colon in the SSID would prematurely terminate the field and
    // corrupt every field after it when scanned by a real phone.
    const result = encodeWifi({
      ssid: 'Weird;SSID:Name',
      password: 'p"a,ss\\word',
      encryption: 'WPA',
      hidden: false,
    });
    expect(result).toBe('WIFI:T:WPA;S:Weird\\;SSID\\:Name;P:p\\"a\\,ss\\\\word;;');
  });
});

describe('encodeVCard', () => {
  it('produces a well-formed vCard 3.0 with BEGIN/END and required N/FN fields', () => {
    const result = encodeVCard({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(result).toMatch(/^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
    expect(result).toContain('N:Lovelace;Ada;;;');
    expect(result).toContain('FN:Ada Lovelace');
    expect(result.trim().endsWith('END:VCARD')).toBe(true);
  });

  it('omits optional fields that were not provided', () => {
    const result = encodeVCard({ firstName: 'Ada' });
    expect(result).not.toContain('ORG:');
    expect(result).not.toContain('TEL');
    expect(result).not.toContain('EMAIL:');
  });

  it('includes optional fields when provided', () => {
    const result = encodeVCard({
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'Analytical Engines Ltd',
      email: 'ada@example.com',
      phone: '+14155552671',
    });
    expect(result).toContain('ORG:Analytical Engines Ltd');
    expect(result).toContain('EMAIL:ada@example.com');
    expect(result).toContain('TEL;TYPE=WORK,VOICE:+14155552671');
  });

  it('escapes commas, semicolons and newlines in free-text fields', () => {
    const result = encodeVCard({ firstName: 'Ada', note: 'Line one\nComma, semicolon;' });
    expect(result).toContain('NOTE:Line one\\nComma\\, semicolon\\;');
  });
});

describe('encodeLocation', () => {
  it('produces a geo: URI', () => {
    expect(encodeLocation({ latitude: 40.7128, longitude: -74.006 })).toBe('geo:40.7128,-74.006');
  });

  it('appends a URL-encoded query when a place name is given', () => {
    expect(
      encodeLocation({ latitude: 40.7128, longitude: -74.006, query: 'Statue of Liberty' }),
    ).toBe('geo:40.7128,-74.006?q=Statue%20of%20Liberty');
  });
});

describe('encodeEvent', () => {
  it('formats a timed event as UTC basic ICS format (YYYYMMDDTHHMMSSZ)', () => {
    const result = encodeEvent({
      title: 'Launch',
      start: '2026-09-01T18:30:00.000Z',
      allDay: false,
    });
    expect(result).toContain('DTSTART:20260901T183000Z');
    expect(result).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(result.trim().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('formats an all-day event as a bare date (YYYYMMDD, no time/Z)', () => {
    const result = encodeEvent({
      title: 'Holiday',
      start: '2026-09-01T00:00:00.000Z',
      allDay: true,
    });
    expect(result).toContain('DTSTART:20260901\r\n');
  });

  it('includes DTEND only when an end was provided', () => {
    const withoutEnd = encodeEvent({ title: 'x', start: '2026-09-01T00:00:00.000Z', allDay: true });
    expect(withoutEnd).not.toContain('DTEND');

    const withEnd = encodeEvent({
      title: 'x',
      start: '2026-09-01T00:00:00.000Z',
      end: '2026-09-02T00:00:00.000Z',
      allDay: true,
    });
    expect(withEnd).toContain('DTEND:20260902');
  });
});

describe('encodeCrypto', () => {
  it('produces a lowercase-scheme URI with the address', () => {
    expect(encodeCrypto({ currency: 'BTC', address: '1A1zP1' })).toBe('btc:1A1zP1');
  });

  it('appends amount and message as query params', () => {
    expect(
      encodeCrypto({ currency: 'ETH', address: '0xabc', amount: 0.5, message: 'coffee' }),
    ).toBe('eth:0xabc?amount=0.5&message=coffee');
  });
});

describe('resolveAppStoreUrlForPlatform', () => {
  const payload = {
    iosUrl: 'https://apps.apple.com/app/id123',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.example',
    fallbackUrl: 'https://example.com/download',
  };

  it('prefers the platform-specific URL', () => {
    expect(resolveAppStoreUrlForPlatform(payload, 'ios')).toBe(payload.iosUrl);
    expect(resolveAppStoreUrlForPlatform(payload, 'android')).toBe(payload.androidUrl);
  });

  it('falls back to fallbackUrl when the platform-specific URL is missing', () => {
    expect(resolveAppStoreUrlForPlatform({ fallbackUrl: payload.fallbackUrl }, 'ios')).toBe(
      payload.fallbackUrl,
    );
  });

  it('for "other" platforms, prefers fallbackUrl, then iOS, then Android', () => {
    expect(resolveAppStoreUrlForPlatform(payload, 'other')).toBe(payload.fallbackUrl);
    expect(resolveAppStoreUrlForPlatform({ androidUrl: payload.androidUrl }, 'other')).toBe(
      payload.androidUrl,
    );
  });

  it('returns an empty string when nothing is configured', () => {
    expect(resolveAppStoreUrlForPlatform({}, 'ios')).toBe('');
  });
});

describe('encodeStaticContent', () => {
  it('dispatches to the correct encoder based on content type', () => {
    expect(encodeStaticContent(ContentType.URL, { url: 'https://example.com' })).toBe(
      'https://example.com',
    );
    expect(encodeStaticContent(ContentType.TEXT, { text: 'hello' })).toBe('hello');
  });

  it('falls back through redirectUrl -> body -> title for CUSTOM content', () => {
    expect(encodeStaticContent(ContentType.CUSTOM, { redirectUrl: 'https://x.com' })).toBe(
      'https://x.com',
    );
    expect(encodeStaticContent(ContentType.CUSTOM, { body: 'body text' })).toBe('body text');
    expect(encodeStaticContent(ContentType.CUSTOM, { title: 'title only' })).toBe('title only');
  });

  it('throws for content types that require a dynamic QR code (need a landing page)', () => {
    expect(() =>
      encodeStaticContent(ContentType.PDF, { fileId: '11111111-1111-1111-1111-111111111111' }),
    ).toThrow(/requires a dynamic QR code/);
    expect(() =>
      encodeStaticContent(ContentType.IMAGE, { fileId: '11111111-1111-1111-1111-111111111111' }),
    ).toThrow(/requires a dynamic QR code/);
    expect(() =>
      encodeStaticContent(ContentType.APP_STORE, { iosUrl: 'https://apps.apple.com/app/id123' }),
    ).toThrow(/requires a dynamic QR code/);
  });
});
