import { AppShell } from '@/components/layout/app-shell';
import { AdminSubNav } from '@/components/admin/admin-sub-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Platform-wide oversight and configuration.</p>
        </div>
        <AdminSubNav />
        {children}
      </div>
    </AppShell>
  );
}
