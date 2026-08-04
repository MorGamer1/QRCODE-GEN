export const SHORT_CODE_LENGTH = 7;
export const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const SHORT_CODE_REGEX = /^[a-zA-Z0-9]{4,32}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const QR_NAME_MAX_LENGTH = 120;
export const QR_NOTES_MAX_LENGTH = 2000;
export const QR_TAG_MAX_LENGTH = 40;
export const QR_MAX_TAGS = 20;

export const MAX_BULK_OPERATION_SIZE = 500;

export const LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const FILE_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (PDF/Image content QR)
export const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
export const ALLOWED_FILE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
export const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 60;
export const DEFAULT_EMAIL_VERIFICATION_TTL_HOURS = 48;

export const RATE_LIMIT = {
  AUTH: { limit: 10, ttlSeconds: 60 },
  REDIRECT: { limit: 120, ttlSeconds: 60 },
  API_DEFAULT: { limit: 100, ttlSeconds: 60 },
  API_KEY_DEFAULT: { limit: 300, ttlSeconds: 60 },
} as const;

export const QR_EXPORT_DPI_PRESETS = [72, 150, 300, 600] as const;
export const QR_EXPORT_SIZE_MIN = 128;
export const QR_EXPORT_SIZE_MAX = 4096;
export const QR_EXPORT_SIZE_DEFAULT = 1024;
