'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCategoryDto } from '@qrgen/shared';
import { api } from '@/lib/api-client';
import type { Category } from '@/lib/qr-types';

const categoryKeys = { all: ['categories'] as const };

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => api.post<Category>('/categories', dto),
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(categoryKeys.all, (prev) => (prev ? [...prev, category] : [category]));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/categories/${id}`),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Category[]>(categoryKeys.all, (prev) => prev?.filter((c) => c.id !== id));
    },
  });
}
