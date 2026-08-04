'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UserRole,
} from '@qrgen/shared';
import { api } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const;

/** Full profile of the signed-in user, or an error (incl. 401 once refresh has been tried) when logged out. */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => api.get<AuthUser>('/users/me'),
  });
}

interface LoginResponse {
  twoFactorRequired?: boolean;
  user?: AuthUser;
  accessToken?: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<LoginResponse>('/auth/login', dto),
    onSuccess: (data) => {
      if (data.user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
    },
  });
}

interface RegisterResponse {
  user: AuthUser;
  requiresEmailVerification: boolean;
  accessToken?: string;
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<RegisterResponse>('/auth/register', dto),
    onSuccess: (data) => {
      if (!data.requiresEmailVerification) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api.post<{ success: boolean }>('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => api.post<{ success: boolean }>('/auth/forgot-password', dto),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => api.post<{ success: boolean }>('/auth/reset-password', dto),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => api.post<{ success: boolean }>('/auth/verify-email', { token }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => api.post<{ success: boolean }>('/auth/change-password', dto),
  });
}
