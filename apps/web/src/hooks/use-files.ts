'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { FileAsset } from '@/lib/qr-types';

export type FileUploadPurpose = 'logo' | 'content';

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ file, purpose }: { file: File; purpose: FileUploadPurpose }) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<FileAsset>('/files/upload', form, { purpose });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'], exact: false }),
  });
}
