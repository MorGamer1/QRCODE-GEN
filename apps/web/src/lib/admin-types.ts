import type { UserRole } from '@qrgen/shared';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isSuspended: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { qrCodes: number };
}

export interface AdminStats {
  totalUsers: number;
  totalQrCodes: number;
  totalStaticQrCodes: number;
  totalDynamicQrCodes: number;
  totalScans: number;
  activeUsersToday: number;
}

export interface SystemSettings {
  id: string;
  gdprStoreIp: boolean;
  gdprHashIp: boolean;
  defaultRedirectStatusCode: number;
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  maxQrCodesPerUser: number | null;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
}

export interface BackupFileInfo {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}
