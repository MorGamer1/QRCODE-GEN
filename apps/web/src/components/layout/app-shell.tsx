'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@qrgen/shared';
import { useCurrentUser } from '@/hooks/use-auth';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * Shared authenticated chrome for /dashboard and /admin. Auth is enforced here (not just in
 * middleware) because the refresh-token cookie middleware checks only proves a session
 * probably exists - this hook actually calls the API (with silent access-token refresh)
 * and is the real authority on whether the user is allowed to see what's behind it.
 */
export function AppShell({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const { data: user, isPending, isError } = useCurrentUser();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  React.useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  React.useEffect(() => {
    if (user && requireAdmin && !isAdmin) router.replace('/dashboard');
  }, [user, requireAdmin, isAdmin, router]);

  if (isPending || !user || (requireAdmin && !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
