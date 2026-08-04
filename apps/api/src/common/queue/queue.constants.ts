export const SCAN_EVENTS_QUEUE = 'scan-events';

/** Raw, unparsed scan data captured on the hot redirect path - geoip/UA parsing happens in the worker. */
export interface ScanEventJob {
  qrCodeId: string;
  scannedAt: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  acceptLanguage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}
