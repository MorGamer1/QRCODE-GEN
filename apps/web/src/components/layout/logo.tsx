import Link from 'next/link';
import { QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <QrCode className="h-5 w-5" />
      </span>
      {!iconOnly && <span className="text-lg">QRGen</span>}
    </Link>
  );
}
