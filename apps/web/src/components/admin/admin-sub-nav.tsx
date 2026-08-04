'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'QR Codes', href: '/admin/qr-codes' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Audit Logs', href: '/admin/audit-logs' },
  { label: 'Backups', href: '/admin/backups' },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active =
          item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
