'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { QrCodeType } from '@qrgen/shared';
import { useQrCode } from '@/hooks/use-qr-codes';
import { formatDate } from '@/lib/utils';
import { QrWizard } from '@/components/qr-wizard/qr-wizard';
import { RedirectSettingsForm } from '@/components/qr-wizard/redirect-settings-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function QrCodeDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: qr, isPending, isError } = useQrCode(params.id);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !qr) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This QR code couldn&apos;t be found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/qr-codes">
            <ArrowLeft className="h-4 w-4" /> Back to QR codes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/qr-codes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{qr.name}</h1>
          <p className="text-sm text-muted-foreground">
            {qr.totalScans} scan{qr.totalScans === 1 ? '' : 's'} &middot; Created {formatDate(qr.createdAt)}
          </p>
        </div>
      </div>

      <QrWizard existingQr={qr} />

      {qr.type === QrCodeType.DYNAMIC && <RedirectSettingsForm qr={qr} />}
    </div>
  );
}
