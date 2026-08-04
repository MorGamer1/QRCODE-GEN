'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminListUsersQueryDto, AdminSettingsDto, AdminUpdateUserDto } from '@qrgen/shared';
import { api, apiDownloadUrl } from '@/lib/api-client';
import type { AdminStats, AdminUser, AuditLogEntry, BackupFileInfo, SystemSettings } from '@/lib/admin-types';
import type { PaginatedResult, QrCode } from '@/lib/qr-types';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  });
}

export function useAdminUsers(query: Partial<AdminListUsersQueryDto>) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => api.get<PaginatedResult<AdminUser>>('/admin/users', query as QueryParams),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AdminUpdateUserDto }) => api.patch<AdminUser>(`/admin/users/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false }),
  });
}

export function useAdminQrCodes(query: { page: number; pageSize: number; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'qr-codes', query],
    queryFn: () => api.get<PaginatedResult<QrCode & { user: { id: string; email: string; name: string } }>>('/admin/qr-codes', query),
    placeholderData: (prev) => prev,
  });
}

export function useDeleteAdminQrCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/admin/qr-codes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'], exact: false }),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get<SystemSettings>('/admin/settings'),
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdminSettingsDto) => api.patch<SystemSettings>('/admin/settings', dto),
    onSuccess: (settings) => queryClient.setQueryData(['admin', 'settings'], settings),
  });
}

export function useAuditLogs(query: { page: number; pageSize: number; userId?: string; action?: string }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', query],
    queryFn: () => api.get<PaginatedResult<AuditLogEntry>>('/admin/audit-logs', query as QueryParams),
    placeholderData: (prev) => prev,
  });
}

export function useBackups() {
  return useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: () => api.get<BackupFileInfo[]>('/admin/backups'),
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<BackupFileInfo>('/admin/backups'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] }),
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileName: string) => api.delete<{ success: boolean }>(`/admin/backups/${fileName}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] }),
  });
}

export function backupDownloadUrl(fileName: string): string {
  return apiDownloadUrl(`/admin/backups/${fileName}/download`);
}
