import { ContentType } from '../enums';
import {
  appStoreContentSchema,
  cryptoContentSchema,
  emailContentSchema,
  eventContentSchema,
  getContentSchema,
  locationContentSchema,
  phoneContentSchema,
  smsContentSchema,
  socialContentSchema,
  urlContentSchema,
  validateContentPayload,
  vcardContentSchema,
  whatsappContentSchema,
  wifiContentSchema,
} from './schemas';

describe('urlContentSchema', () => {
  it('accepts a valid https URL', () => {
    expect(urlContentSchema.safeParse({ url: 'https://example.com' }).success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(urlContentSchema.safeParse({ url: 'not a url' }).success).toBe(false);
  });

  it('rejects a URL over 2048 characters', () => {
    const url = `https://example.com/${'a'.repeat(2048)}`;
    expect(urlContentSchema.safeParse({ url }).success).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    const result = urlContentSchema.parse({ url: '  https://example.com  ' });
    expect(result.url).toBe('https://example.com');
  });
});

describe('emailContentSchema', () => {
  it('requires a valid email address', () => {
    expect(emailContentSchema.safeParse({ to: 'not-an-email' }).success).toBe(false);
    expect(emailContentSchema.safeParse({ to: 'person@example.com' }).success).toBe(true);
  });

  it('allows subject and body to be omitted', () => {
    expect(emailContentSchema.safeParse({ to: 'person@example.com' }).success).toBe(true);
  });
});

describe('phoneContentSchema / E.164 validation', () => {
  it.each(['+14155552671', '+442071838750', '14155552671'])('accepts %p', (phone) => {
    expect(phoneContentSchema.safeParse({ phone }).success).toBe(true);
  });

  it.each(['not-a-phone', '123', '+0123456789', 'abc123'])('rejects %p', (phone) => {
    expect(phoneContentSchema.safeParse({ phone }).success).toBe(false);
  });
});

describe('smsContentSchema / whatsappContentSchema', () => {
  it('requires E.164 phone, message optional', () => {
    expect(smsContentSchema.safeParse({ phone: '+14155552671' }).success).toBe(true);
    expect(smsContentSchema.safeParse({ phone: 'invalid' }).success).toBe(false);
  });

  it('caps SMS message length at 918 chars (concatenated SMS limit)', () => {
    expect(
      smsContentSchema.safeParse({ phone: '+14155552671', message: 'a'.repeat(918) }).success,
    ).toBe(true);
    expect(
      smsContentSchema.safeParse({ phone: '+14155552671', message: 'a'.repeat(919) }).success,
    ).toBe(false);
  });

  it('caps WhatsApp message length at 2000 chars', () => {
    expect(
      whatsappContentSchema.safeParse({ phone: '+14155552671', message: 'a'.repeat(2001) })
        .success,
    ).toBe(false);
  });
});

describe('wifiContentSchema', () => {
  it('defaults encryption to WPA and hidden to false', () => {
    const result = wifiContentSchema.parse({ ssid: 'MyNetwork' });
    expect(result.encryption).toBe('WPA');
    expect(result.hidden).toBe(false);
  });

  it('allows encryption "nopass" with no password', () => {
    expect(wifiContentSchema.safeParse({ ssid: 'Open', encryption: 'nopass' }).success).toBe(true);
  });

  it('requires a non-empty SSID', () => {
    expect(wifiContentSchema.safeParse({ ssid: '' }).success).toBe(false);
  });

  it('rejects an unknown encryption type', () => {
    expect(wifiContentSchema.safeParse({ ssid: 'x', encryption: 'WPA3-ENTERPRISE' }).success).toBe(
      false,
    );
  });
});

describe('vcardContentSchema', () => {
  it('requires only a first name', () => {
    expect(vcardContentSchema.safeParse({ firstName: 'Ada' }).success).toBe(true);
  });

  it('accepts empty string for optional contact fields (form-friendly)', () => {
    expect(
      vcardContentSchema.safeParse({ firstName: 'Ada', phone: '', email: '', website: '' })
        .success,
    ).toBe(true);
  });

  it('still validates non-empty optional fields', () => {
    expect(vcardContentSchema.safeParse({ firstName: 'Ada', email: 'not-an-email' }).success).toBe(
      false,
    );
  });
});

describe('locationContentSchema', () => {
  it('accepts valid lat/lng bounds', () => {
    expect(locationContentSchema.safeParse({ latitude: 90, longitude: 180 }).success).toBe(true);
    expect(locationContentSchema.safeParse({ latitude: -90, longitude: -180 }).success).toBe(true);
  });

  it('rejects out-of-range latitude/longitude', () => {
    expect(locationContentSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
    expect(locationContentSchema.safeParse({ latitude: 0, longitude: 181 }).success).toBe(false);
  });
});

describe('eventContentSchema', () => {
  const base = { title: 'Launch party', start: '2026-09-01T18:00:00.000Z' };

  it('accepts a start with no end', () => {
    expect(eventContentSchema.safeParse(base).success).toBe(true);
  });

  it('accepts an end after the start', () => {
    expect(
      eventContentSchema.safeParse({ ...base, end: '2026-09-01T20:00:00.000Z' }).success,
    ).toBe(true);
  });

  it('rejects an end before the start', () => {
    const result = eventContentSchema.safeParse({ ...base, end: '2026-09-01T10:00:00.000Z' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['end']);
    }
  });

  it('accepts an end exactly equal to the start', () => {
    expect(eventContentSchema.safeParse({ ...base, end: base.start }).success).toBe(true);
  });

  it('rejects a non-ISO datetime', () => {
    expect(eventContentSchema.safeParse({ title: 'x', start: '2026-09-01' }).success).toBe(false);
  });
});

describe('cryptoContentSchema', () => {
  it('accepts a supported currency and plausible address', () => {
    expect(
      cryptoContentSchema.safeParse({ currency: 'BTC', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
        .success,
    ).toBe(true);
  });

  it('rejects an unsupported currency code', () => {
    expect(cryptoContentSchema.safeParse({ currency: 'DOGECOIN', address: '1234567890' }).success).toBe(
      false,
    );
  });

  it('rejects a non-positive amount', () => {
    expect(
      cryptoContentSchema.safeParse({ currency: 'BTC', address: '1234567890', amount: 0 }).success,
    ).toBe(false);
    expect(
      cryptoContentSchema.safeParse({ currency: 'BTC', address: '1234567890', amount: -1 }).success,
    ).toBe(false);
  });
});

describe('appStoreContentSchema', () => {
  it('requires at least one of iosUrl/androidUrl/fallbackUrl', () => {
    expect(appStoreContentSchema.safeParse({}).success).toBe(false);
    expect(
      appStoreContentSchema.safeParse({ iosUrl: 'https://apps.apple.com/app/id123' }).success,
    ).toBe(true);
  });
});

describe('socialContentSchema', () => {
  it('accepts a known platform', () => {
    expect(
      socialContentSchema.safeParse({ platform: 'instagram', url: 'https://instagram.com/x' })
        .success,
    ).toBe(true);
  });

  it('rejects an unknown platform', () => {
    expect(
      socialContentSchema.safeParse({ platform: 'myspace', url: 'https://myspace.com/x' }).success,
    ).toBe(false);
  });
});

describe('getContentSchema / validateContentPayload', () => {
  it('resolves the correct schema for every ContentType member', () => {
    for (const type of Object.values(ContentType)) {
      expect(getContentSchema(type)).toBeDefined();
    }
  });

  it('validateContentPayload parses valid input', () => {
    const result = validateContentPayload(ContentType.URL, { url: 'https://example.com' });
    expect(result.url).toBe('https://example.com');
  });

  it('validateContentPayload throws (ZodError) on invalid input', () => {
    expect(() => validateContentPayload(ContentType.URL, { url: 'nope' })).toThrow();
  });
});
