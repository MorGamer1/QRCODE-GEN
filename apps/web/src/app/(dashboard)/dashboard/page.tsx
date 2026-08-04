'use client';

import Link from 'next/link';
import { Plus, QrCode, BarChart3, KeyRound } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const shortcuts = [
  {
    title: 'Create a QR code',
    description: 'Static or dynamic, styled and ready to print or share.',
    href: '/dashboard/qr-codes/new',
    icon: QrCode,
  },
  {
    title: 'View analytics',
    description: 'Scans by device, location, and time across every code.',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Manage API keys',
    description: 'Automate QR creation and reporting from your own systems.',
    href: '/dashboard/api-keys',
    icon: KeyRound,
  },
];

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your QR codes.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qr-codes/new">
            <Plus className="h-4 w-4" /> Create QR code
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <shortcut.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{shortcut.title}</CardTitle>
                <CardDescription>{shortcut.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <QrCode className="h-8 w-8" />
          <p className="text-sm">Your QR codes and recent scan activity will show up here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
