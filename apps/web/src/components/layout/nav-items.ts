import { LayoutDashboard, QrCode, BarChart3, KeyRound, Settings, ShieldCheck, type LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'API Keys', href: '/dashboard/api-keys', icon: KeyRound },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const ADMIN_NAV_ITEM: NavItem = { label: 'Admin', href: '/admin', icon: ShieldCheck };
