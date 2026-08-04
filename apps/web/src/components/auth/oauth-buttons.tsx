'use client';

import { Github } from 'lucide-react';
import { useAuthConfig } from '@/hooks/use-auth-config';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from './google-icon';

const API_BASE = '/api/v1';

export function OAuthButtons() {
  const { data } = useAuthConfig();
  if (!data || (!data.oauth.google && !data.oauth.github)) return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className={data.oauth.google && data.oauth.github ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
        {data.oauth.google && (
          <Button variant="outline" asChild>
            <a href={`${API_BASE}/auth/google`}>
              <GoogleIcon /> Google
            </a>
          </Button>
        )}
        {data.oauth.github && (
          <Button variant="outline" asChild>
            <a href={`${API_BASE}/auth/github`}>
              <Github className="h-4 w-4" /> GitHub
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
