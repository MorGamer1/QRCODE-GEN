import { SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH, SHORT_CODE_REGEX } from '../constants';

export function isValidShortCode(code: string): boolean {
  return SHORT_CODE_REGEX.test(code);
}

/**
 * Cryptographically-random short code generator. Uses the platform Web Crypto
 * API (available in Node >=19 as `globalThis.crypto` and in all browsers), so
 * it works unmodified in both the API and the web app's live preview.
 */
export function generateShortCode(length: number = SHORT_CODE_LENGTH): string {
  const bytes = new Uint32Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += SHORT_CODE_ALPHABET[bytes[i]! % SHORT_CODE_ALPHABET.length];
  }
  return result;
}

export function buildRedirectUrl(baseUrl: string, shortCode: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/r/${shortCode}`;
}
