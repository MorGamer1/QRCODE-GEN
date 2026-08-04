import { ContentType, INSTANT_REDIRECT_CONTENT_TYPES } from '../enums';

export interface ContentTypeMeta {
  type: ContentType;
  label: string;
  description: string;
  icon: string;
  /** Only available as a dynamic QR (needs a server-resolved landing page or uploaded file). */
  dynamicOnly: boolean;
  category: 'general' | 'contact' | 'business' | 'media' | 'other';
}

/**
 * Registry of built-in content types. New content types can be added here
 * (schema in content/schemas.ts, encoder in content/encoders.ts, entry here)
 * without touching QR generation, storage or redirect-resolution code paths -
 * this is the "plugin point" referenced in the product spec.
 */
export const CONTENT_TYPE_REGISTRY: Record<ContentType, ContentTypeMeta> = {
  [ContentType.URL]: {
    type: ContentType.URL,
    label: 'Website URL',
    description: 'Link to any website or web page',
    icon: 'link',
    dynamicOnly: false,
    category: 'general',
  },
  [ContentType.TEXT]: {
    type: ContentType.TEXT,
    label: 'Plain Text',
    description: 'Display a block of text',
    icon: 'text',
    dynamicOnly: false,
    category: 'general',
  },
  [ContentType.EMAIL]: {
    type: ContentType.EMAIL,
    label: 'Email',
    description: 'Pre-filled email message',
    icon: 'mail',
    dynamicOnly: false,
    category: 'contact',
  },
  [ContentType.PHONE]: {
    type: ContentType.PHONE,
    label: 'Phone Call',
    description: 'Dial a phone number',
    icon: 'phone',
    dynamicOnly: false,
    category: 'contact',
  },
  [ContentType.SMS]: {
    type: ContentType.SMS,
    label: 'SMS',
    description: 'Pre-filled text message',
    icon: 'message-square',
    dynamicOnly: false,
    category: 'contact',
  },
  [ContentType.WHATSAPP]: {
    type: ContentType.WHATSAPP,
    label: 'WhatsApp',
    description: 'Start a WhatsApp chat',
    icon: 'message-circle',
    dynamicOnly: false,
    category: 'contact',
  },
  [ContentType.WIFI]: {
    type: ContentType.WIFI,
    label: 'Wi-Fi',
    description: 'Connect to a Wi-Fi network',
    icon: 'wifi',
    dynamicOnly: false,
    category: 'general',
  },
  [ContentType.VCARD]: {
    type: ContentType.VCARD,
    label: 'vCard Contact',
    description: 'Shareable digital business card',
    icon: 'contact',
    dynamicOnly: false,
    category: 'contact',
  },
  [ContentType.LOCATION]: {
    type: ContentType.LOCATION,
    label: 'Location',
    description: 'Point to a place on the map',
    icon: 'map-pin',
    dynamicOnly: false,
    category: 'general',
  },
  [ContentType.EVENT]: {
    type: ContentType.EVENT,
    label: 'Calendar Event',
    description: 'Add an event to a calendar',
    icon: 'calendar',
    dynamicOnly: false,
    category: 'business',
  },
  [ContentType.CRYPTO]: {
    type: ContentType.CRYPTO,
    label: 'Crypto Wallet',
    description: 'Receive cryptocurrency payments',
    icon: 'bitcoin',
    dynamicOnly: false,
    category: 'business',
  },
  [ContentType.PDF]: {
    type: ContentType.PDF,
    label: 'PDF Document',
    description: 'Share an uploaded PDF file',
    icon: 'file-text',
    dynamicOnly: true,
    category: 'media',
  },
  [ContentType.IMAGE]: {
    type: ContentType.IMAGE,
    label: 'Image',
    description: 'Share an uploaded image',
    icon: 'image',
    dynamicOnly: true,
    category: 'media',
  },
  [ContentType.APP_STORE]: {
    type: ContentType.APP_STORE,
    label: 'App Store',
    description: 'Smart-route to the iOS or Android store listing',
    icon: 'smartphone',
    dynamicOnly: true,
    category: 'business',
  },
  [ContentType.SOCIAL]: {
    type: ContentType.SOCIAL,
    label: 'Social Media',
    description: 'Link to a social media profile',
    icon: 'share-2',
    dynamicOnly: false,
    category: 'other',
  },
  [ContentType.CUSTOM]: {
    type: ContentType.CUSTOM,
    label: 'Custom',
    description: 'Custom key/value content for advanced use cases',
    icon: 'puzzle',
    dynamicOnly: false,
    category: 'other',
  },
};

export function isInstantRedirect(type: ContentType): boolean {
  return INSTANT_REDIRECT_CONTENT_TYPES.has(type);
}

export function listContentTypes(): ContentTypeMeta[] {
  return Object.values(CONTENT_TYPE_REGISTRY);
}
