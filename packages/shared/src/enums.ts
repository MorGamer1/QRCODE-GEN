/**
 * Central enums shared across the API, worker and web app.
 * Kept as plain string enums so values are stable across Prisma, zod and JSON payloads.
 */

export enum QrCodeType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}

export enum ContentType {
  URL = 'URL',
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  WIFI = 'WIFI',
  VCARD = 'VCARD',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  CRYPTO = 'CRYPTO',
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  APP_STORE = 'APP_STORE',
  SOCIAL = 'SOCIAL',
  CUSTOM = 'CUSTOM',
}

/** Content types that always resolve to an instant HTTP redirect (no landing page). */
export const INSTANT_REDIRECT_CONTENT_TYPES: ReadonlySet<ContentType> = new Set([
  ContentType.URL,
  ContentType.PHONE,
  ContentType.SMS,
  ContentType.WHATSAPP,
  ContentType.EMAIL,
  ContentType.APP_STORE,
]);

export enum RedirectStatusCode {
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  TEMPORARY_REDIRECT = 307,
}

export enum ExportFormat {
  PNG = 'PNG',
  SVG = 'SVG',
  PDF = 'PDF',
  EPS = 'EPS',
  WEBP = 'WEBP',
}

export enum ErrorCorrectionLevel {
  L = 'L',
  M = 'M',
  Q = 'Q',
  H = 'H',
}

export enum ModuleShape {
  SQUARE = 'SQUARE',
  ROUNDED = 'ROUNDED',
  DOTS = 'DOTS',
  CLASSY = 'CLASSY',
  CLASSY_ROUNDED = 'CLASSY_ROUNDED',
  EXTRA_ROUNDED = 'EXTRA_ROUNDED',
}

export enum EyeFrameShape {
  SQUARE = 'SQUARE',
  ROUNDED = 'ROUNDED',
  CIRCLE = 'CIRCLE',
  LEAF = 'LEAF',
}

export enum EyeBallShape {
  SQUARE = 'SQUARE',
  ROUNDED = 'ROUNDED',
  CIRCLE = 'CIRCLE',
  DOT = 'DOT',
}

export enum GradientType {
  LINEAR = 'LINEAR',
  RADIAL = 'RADIAL',
}

export enum FrameStyle {
  NONE = 'NONE',
  BOTTOM_LABEL = 'BOTTOM_LABEL',
  TOP_LABEL = 'TOP_LABEL',
  BANNER = 'BANNER',
  ROUNDED_BORDER = 'ROUNDED_BORDER',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum RedirectRuleType {
  DEVICE = 'DEVICE',
  COUNTRY = 'COUNTRY',
  LANGUAGE = 'LANGUAGE',
  TIME = 'TIME',
}

export enum DeviceCategory {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
  BOT = 'BOT',
  OTHER = 'OTHER',
}

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_2FA_ENABLED = 'USER_2FA_ENABLED',
  USER_2FA_DISABLED = 'USER_2FA_DISABLED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  QR_CREATED = 'QR_CREATED',
  QR_UPDATED = 'QR_UPDATED',
  QR_DELETED = 'QR_DELETED',
  QR_ARCHIVED = 'QR_ARCHIVED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  ADMIN_SETTINGS_UPDATED = 'ADMIN_SETTINGS_UPDATED',
  BACKUP_CREATED = 'BACKUP_CREATED',
}

export enum ApiKeyScope {
  QR_READ = 'qr:read',
  QR_WRITE = 'qr:write',
  ANALYTICS_READ = 'analytics:read',
  ADMIN = 'admin',
}
