import type { UserRole } from '@qrgen/shared';
import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';

export function Sidebar({ role }: { role?: UserRole }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
