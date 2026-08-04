import { z } from 'zod';
import { ContentType } from '../enums';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const urlContentSchema = z.object({
  url: z.string().trim().url().max(2048),
});

export const textContentSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export const emailContentSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().max(255).optional(),
  body: z.string().trim().max(4000).optional(),
});

export const phoneContentSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number, use E.164 format'),
});

export const smsContentSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number, use E.164 format'),
  message: z.string().trim().max(918).optional(),
});

export const whatsappContentSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number, use E.164 format'),
  message: z.string().trim().max(2000).optional(),
});

export const wifiEncryptionSchema = z.enum(['WPA', 'WEP', 'nopass']);

export const wifiContentSchema = z.object({
  ssid: z.string().trim().min(1).max(64),
  password: z.string().max(128).optional(),
  encryption: wifiEncryptionSchema.default('WPA'),
  hidden: z.boolean().default(false),
});

export const vcardContentSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  organization: z.string().trim().max(150).optional(),
  title: z.string().trim().max(150).optional(),
  phone: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  mobile: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  website: z.string().trim().url().optional().or(z.literal('')),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

export const locationContentSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  query: z.string().trim().max(255).optional(),
});

export const eventContentSchema = z
  .object({
    title: z.string().trim().min(1).max(150),
    location: z.string().trim().max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    start: z.string().datetime(),
    end: z.string().datetime().optional(),
    allDay: z.boolean().default(false),
    timezone: z.string().trim().max(64).optional(),
  })
  .refine((data) => !data.end || new Date(data.end) >= new Date(data.start), {
    message: 'Event end must be after start',
    path: ['end'],
  });

export const cryptoCurrencySchema = z.enum(['BTC', 'ETH', 'LTC', 'BCH', 'XRP', 'DOGE', 'SOL', 'USDT']);

export const cryptoContentSchema = z.object({
  currency: cryptoCurrencySchema,
  address: z.string().trim().min(10).max(120),
  amount: z.number().positive().optional(),
  message: z.string().trim().max(255).optional(),
});

export const pdfContentSchema = z.object({
  fileId: z.string().uuid(),
  title: z.string().trim().max(150).optional(),
});

export const imageContentSchema = z.object({
  fileId: z.string().uuid(),
  title: z.string().trim().max(150).optional(),
  caption: z.string().trim().max(500).optional(),
});

export const appStoreContentSchema = z.object({
  iosUrl: z.string().trim().url().optional(),
  androidUrl: z.string().trim().url().optional(),
  fallbackUrl: z.string().trim().url().optional(),
  title: z.string().trim().max(150).optional(),
}).refine((data) => data.iosUrl || data.androidUrl || data.fallbackUrl, {
  message: 'At least one of iosUrl, androidUrl or fallbackUrl is required',
});

export const socialPlatformSchema = z.enum([
  'instagram',
  'facebook',
  'twitter',
  'tiktok',
  'linkedin',
  'youtube',
  'snapchat',
  'telegram',
  'discord',
  'pinterest',
  'threads',
  'other',
]);

export const socialContentSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().trim().url(),
  displayName: z.string().trim().max(100).optional(),
});

/** Generic extensibility hatch: register new content types without a schema migration. */
export const customContentSchema = z.object({
  redirectUrl: z.string().trim().url().optional(),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().max(4000).optional(),
  fields: z.record(z.string(), z.string().max(1000)).optional(),
});

export const contentSchemaMap = {
  [ContentType.URL]: urlContentSchema,
  [ContentType.TEXT]: textContentSchema,
  [ContentType.EMAIL]: emailContentSchema,
  [ContentType.PHONE]: phoneContentSchema,
  [ContentType.SMS]: smsContentSchema,
  [ContentType.WHATSAPP]: whatsappContentSchema,
  [ContentType.WIFI]: wifiContentSchema,
  [ContentType.VCARD]: vcardContentSchema,
  [ContentType.LOCATION]: locationContentSchema,
  [ContentType.EVENT]: eventContentSchema,
  [ContentType.CRYPTO]: cryptoContentSchema,
  [ContentType.PDF]: pdfContentSchema,
  [ContentType.IMAGE]: imageContentSchema,
  [ContentType.APP_STORE]: appStoreContentSchema,
  [ContentType.SOCIAL]: socialContentSchema,
  [ContentType.CUSTOM]: customContentSchema,
} as const;

export type ContentPayloadMap = {
  [K in keyof typeof contentSchemaMap]: z.infer<(typeof contentSchemaMap)[K]>;
};

export function getContentSchema(type: ContentType) {
  return contentSchemaMap[type];
}

export function validateContentPayload<T extends ContentType>(
  type: T,
  payload: unknown,
): ContentPayloadMap[T] {
  const schema = getContentSchema(type);
  return schema.parse(payload) as ContentPayloadMap[T];
}

export const hexColor = () => z.string().trim().regex(hexColorRegex, 'Must be a valid hex color');
