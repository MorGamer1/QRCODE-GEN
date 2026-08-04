'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@qrgen/shared';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, ADMIN_NAV_ITEM } from './nav-items';

export function SidebarNav({ role, onNavigate }: { role?: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items =
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
      ? [...NAV_ITEMS, ADMIN_NAV_ITEM]
      : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
