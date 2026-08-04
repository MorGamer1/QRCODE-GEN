import type { ContentType, QrCodeType, QrDesign, RedirectRuleType } from '@qrgen/shared';

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface RedirectRule {
  id: string;
  qrCodeId: string;
  type: RedirectRuleType;
  condition: Record<string, unknown>;
  destinationUrl: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface QrCode {
  id: string;
  userId: string;
  type: QrCodeType;
  contentType: ContentType;
  shortCode: string | null;
  content: Record<string, unknown>;
  encodedPayload: string;
  design: QrDesign;
  name: string;
  notes: string | null;
  tags: string[];
  categoryId: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  redirectStatusCode: number;
  expiresAt: string | null;
  hasPassword: boolean;
  scanLimit: number | null;
  activateAt: string | null;
  deactivateAt: string | null;
  totalScans: number;
  uniqueScans: number;
  firstScannedAt: string | null;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  redirectRules?: RedirectRule[];
}

export interface FileAsset {
  id: string;
  userId: string;
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
