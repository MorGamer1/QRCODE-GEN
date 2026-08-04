'use client';

import Link from 'next/link';
import {
  Plus,
  QrCode,
  BarChart3,
  KeyRound,
  MousePointerClick,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useAnalyticsOverview } from '@/hooks/use-analytics';
import { useQrCodes } from '@/hooks/use-qr-codes';
import { resolveRangePreset } from '@/lib/date-range-presets';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScanTimeseriesChart } from '@/components/analytics/scan-timeseries-chart';
import { QrThumbnail } from '@/components/qr-management/qr-thumbnail';

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

const RANGE_30D = resolveRangePreset('30d');

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.split(' ')[0];
  const overview = useAnalyticsOverview(RANGE_30D);
  const recentQr = useQrCodes({
    page: 1,
    pageSize: 6,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    isArchived: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your QR codes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qr-codes/new">
            <Plus className="h-4 w-4" /> Create QR code
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={QrCode}
          label="QR codes"
          value={overview.data?.totalQrCodes}
          loading={overview.isPending}
        />
        <StatCard
          icon={MousePointerClick}
          label="Scans (30d)"
          value={overview.data?.totalScans}
          loading={overview.isPending}
        />
        <StatCard
          icon={Eye}
          label="Unique scans (30d)"
          value={overview.data?.totalUniqueScans}
          loading={overview.isPending}
        />
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
        <CardHeader>
          <CardTitle>Scan trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.isPending ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ScanTimeseriesChart data={overview.data?.timeseries ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent QR codes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/qr-codes">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentQr.isPending && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          )}
          {!recentQr.isPending && (recentQr.data?.items.length ?? 0) === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <QrCode className="h-8 w-8" />
              <p className="text-sm">Your QR codes will show up here once you create one.</p>
            </div>
          )}
          {!recentQr.isPending && recentQr.data && recentQr.data.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {recentQr.data.items.map((qr) => (
                <Link
                  key={qr.id}
                  href={`/dashboard/qr-codes/${qr.id}`}
                  className="group space-y-1.5"
                >
                  <QrThumbnail
                    qr={qr}
                    className="aspect-square w-full transition-colors group-hover:border-primary/50"
                  />
                  <p className="truncate text-xs font-medium">{qr.name}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold leading-none">{formatNumber(value ?? 0)}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
