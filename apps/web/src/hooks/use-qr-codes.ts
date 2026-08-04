'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkActionDto,
  CreateQrCodeDto,
  DuplicateQrDto,
  ListQrQueryDto,
  RedirectSettingsDto,
  UpdateQrDesignDto,
  UpdateQrMetaDto,
} from '@qrgen/shared';
import { api } from '@/lib/api-client';
import type { PaginatedResult, QrCode } from '@/lib/qr-types';

export const qrCodeKeys = {
  all: ['qr-codes'] as const,
  list: (query: Partial<ListQrQueryDto>) => ['qr-codes', 'list', query] as const,
  detail: (id: string) => ['qr-codes', 'detail', id] as const,
};

export function useQrCodes(query: Partial<ListQrQueryDto>) {
  return useQuery({
    queryKey: qrCodeKeys.list(query),
    queryFn: () => api.get<PaginatedResult<QrCode>>('/qr-codes', query as Record<string, string | number | boolean | undefined>),
    placeholderData: (prev) => prev,
  });
}

export function useQrCode(id: string | undefined) {
  return useQuery({
    queryKey: qrCodeKeys.detail(id ?? ''),
    queryFn: () => api.get<QrCode>(`/qr-codes/${id}`),
    enabled: Boolean(id),
  });
}

export function useBulkQrAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkActionDto) => api.post<{ affected: number }>('/qr-codes/bulk', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qrCodeKeys.all, exact: false }),
  });
}

export function useCreateQrCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQrCodeDto) => api.post<QrCode>('/qr-codes', dto),
    onSuccess: (qr) => {
      queryClient.setQueryData(qrCodeKeys.detail(qr.id), qr);
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.all, exact: false });
    },
  });
}

export function useUpdateQrMeta(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateQrMetaDto) => api.patch<QrCode>(`/qr-codes/${id}/meta`, dto),
    onSuccess: (qr) => {
      queryClient.setQueryData(qrCodeKeys.detail(id), qr);
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.all, exact: false });
    },
  });
}

export function useUpdateQrDesign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateQrDesignDto) => api.put<QrCode>(`/qr-codes/${id}/design`, dto),
    onSuccess: (qr) => queryClient.setQueryData(qrCodeKeys.detail(id), qr),
  });
}

export function useUpdateQrContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { contentType: string; data: Record<string, unknown> }) =>
      api.put<QrCode>(`/qr-codes/${id}/content`, dto),
    onSuccess: (qr) => queryClient.setQueryData(qrCodeKeys.detail(id), qr),
  });
}

export function useUpdateRedirectSettings(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RedirectSettingsDto) => api.put<QrCode>(`/qr-codes/${id}/redirect-settings`, dto),
    onSuccess: (qr) => queryClient.setQueryData(qrCodeKeys.detail(id), qr),
  });
}

export function useDuplicateQrCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DuplicateQrDto }) => api.post<QrCode>(`/qr-codes/${id}/duplicate`, dto),
    onSuccess: (qr) => {
      queryClient.setQueryData(qrCodeKeys.detail(qr.id), qr);
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.all, exact: false });
    },
  });
}

export function useDeleteQrCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/qr-codes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qrCodeKeys.all, exact: false }),
  });
}
