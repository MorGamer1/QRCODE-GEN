'use client';

import { Users, QrCode, MousePointerClick, UserCheck, Radio, Signpost } from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverviewPage() {
  const { data, isPending } = useAdminStats();

  const cards = [
    { icon: Users, label: 'Total users', value: data?.totalUsers },
    { icon: UserCheck, label: 'Active today', value: data?.activeUsersToday },
    { icon: QrCode, label: 'Total QR codes', value: data?.totalQrCodes },
    { icon: Radio, label: 'Dynamic codes', value: data?.totalDynamicQrCodes },
    { icon: Signpost, label: 'Static codes', value: data?.totalStaticQrCodes },
    { icon: MousePointerClick, label: 'Total scans', value: data?.totalScans },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              {isPending ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-semibold leading-none">
                  {formatNumber(card.value ?? 0)}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
