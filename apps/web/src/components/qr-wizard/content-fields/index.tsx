import { ContentType } from '@qrgen/shared';
import { UrlFields, TextFields, PhoneFields } from './simple-fields';
import { EmailFields, SmsFields, WhatsappFields } from './messaging-fields';
import { WifiFields } from './wifi-fields';
import { VCardFields } from './vcard-fields';
import { LocationFields } from './location-fields';
import { EventFields } from './event-fields';
import { CryptoFields } from './crypto-fields';
import { PdfFields, ImageFields } from './media-fields';
import { AppStoreFields } from './app-store-fields';
import { SocialFields } from './social-fields';
import { CustomFields } from './custom-fields';

const CONTENT_FIELD_COMPONENTS: Record<ContentType, React.ComponentType<{ prefix: string }>> = {
  [ContentType.URL]: UrlFields,
  [ContentType.TEXT]: TextFields,
  [ContentType.EMAIL]: EmailFields,
  [ContentType.PHONE]: PhoneFields,
  [ContentType.SMS]: SmsFields,
  [ContentType.WHATSAPP]: WhatsappFields,
  [ContentType.WIFI]: WifiFields,
  [ContentType.VCARD]: VCardFields,
  [ContentType.LOCATION]: LocationFields,
  [ContentType.EVENT]: EventFields,
  [ContentType.CRYPTO]: CryptoFields,
  [ContentType.PDF]: PdfFields,
  [ContentType.IMAGE]: ImageFields,
  [ContentType.APP_STORE]: AppStoreFields,
  [ContentType.SOCIAL]: SocialFields,
  [ContentType.CUSTOM]: CustomFields,
};

export function ContentTypeFields({
  contentType,
  prefix,
}: {
  contentType: ContentType;
  prefix: string;
}) {
  const Component = CONTENT_FIELD_COMPONENTS[contentType];
  return <Component prefix={prefix} />;
}

const TIMEZONE_GUESS =
  typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;

/** Fresh `content.data` shape to reset to whenever the user switches content types. */
export const DEFAULT_CONTENT_DATA: Record<ContentType, Record<string, unknown>> = {
  [ContentType.URL]: { url: '' },
  [ContentType.TEXT]: { text: '' },
  [ContentType.EMAIL]: { to: '', subject: '', body: '' },
  [ContentType.PHONE]: { phone: '' },
  [ContentType.SMS]: { phone: '', message: '' },
  [ContentType.WHATSAPP]: { phone: '', message: '' },
  [ContentType.WIFI]: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  [ContentType.VCARD]: {
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    note: '',
    photoUrl: '',
  },
  [ContentType.LOCATION]: { latitude: '', longitude: '', query: '' },
  [ContentType.EVENT]: {
    title: '',
    location: '',
    description: '',
    start: '',
    end: undefined,
    allDay: false,
    timezone: TIMEZONE_GUESS,
  },
  [ContentType.CRYPTO]: { currency: 'BTC', address: '', amount: undefined, message: '' },
  [ContentType.PDF]: { fileId: null, title: '' },
  [ContentType.IMAGE]: { fileId: null, title: '', caption: '' },
  [ContentType.APP_STORE]: { iosUrl: '', androidUrl: '', fallbackUrl: '', title: '' },
  [ContentType.SOCIAL]: { platform: 'instagram', url: '', displayName: '' },
  [ContentType.CUSTOM]: { redirectUrl: '', title: '', body: '' },
};
