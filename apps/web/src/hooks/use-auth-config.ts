'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface AuthConfig {
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  oauth: { google: boolean; github: boolean };
}

const FALLBACK: AuthConfig = {
  allowPublicRegistration: true,
  requireEmailVerification: true,
  oauth: { google: false, github: false },
};

/** Public capability probe - lets auth pages hide register/OAuth affordances the server won't accept. */
export function useAuthConfig() {
  return useQuery({
    queryKey: ['auth', 'config'],
    queryFn: () => api.get<AuthConfig>('/auth/config'),
    staleTime: 5 * 60_000,
    placeholderData: FALLBACK,
  });
}
