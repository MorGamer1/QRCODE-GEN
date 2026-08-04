import { ContentType } from '@qrgen/shared';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  [ContentType.URL]: 'URL',
  [ContentType.TEXT]: 'Text',
  [ContentType.EMAIL]: 'Email',
  [ContentType.PHONE]: 'Phone',
  [ContentType.SMS]: 'SMS',
  [ContentType.WHATSAPP]: 'WhatsApp',
  [ContentType.WIFI]: 'Wi-Fi',
  [ContentType.VCARD]: 'vCard',
  [ContentType.LOCATION]: 'Location',
  [ContentType.EVENT]: 'Event',
  [ContentType.CRYPTO]: 'Crypto',
  [ContentType.PDF]: 'PDF',
  [ContentType.IMAGE]: 'Image',
  [ContentType.APP_STORE]: 'App Store',
  [ContentType.SOCIAL]: 'Social',
  [ContentType.CUSTOM]: 'Custom',
};
