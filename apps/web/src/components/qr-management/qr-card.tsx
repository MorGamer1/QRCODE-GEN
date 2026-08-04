'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { QrCodeType } from '@qrgen/shared';
import type { QrCode } from '@/lib/qr-types';
import { ApiError, apiDownloadUrl } from '@/lib/api-client';
import { useDeleteQrCode, useDuplicateQrCode, useUpdateQrMeta } from '@/hooks/use-qr-codes';
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QrThumbnail } from './qr-thumbnail';
import { CONTENT_TYPE_LABELS } from './content-type-labels';

export function QrCard({
  qr,
  selected,
  onSelectChange,
}: {
  qr: QrCode;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
}) {
  const updateMeta = useUpdateQrMeta(qr.id);
  const duplicate = useDuplicateQrCode();
  const remove = useDeleteQrCode();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const toggleFavorite = () =>
    updateMeta.mutate(
      { isFavorite: !qr.isFavorite },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update') },
    );

  const toggleArchive = () =>
    updateMeta.mutate(
      { isArchived: !qr.isArchived },
      {
        onSuccess: () => toast.success(qr.isArchived ? 'Restored from archive' : 'Archived'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update'),
      },
    );

  const handleDuplicate = () =>
    duplicate.mutate(
      { id: qr.id, dto: {} },
      {
        onSuccess: () => toast.success('Duplicated'),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Failed to duplicate'),
      },
    );

  const handleDelete = () =>
    remove.mutate(qr.id, {
      onSuccess: () => {
        toast.success('QR code deleted');
        setDeleteOpen(false);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
    });

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="absolute left-3 top-3 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelectChange(Boolean(v))}
          aria-label={`Select ${qr.name}`}
        />
      </div>
      <button
        type="button"
        onClick={toggleFavorite}
        className="absolute right-3 top-3 z-10 rounded-full p-1 text-muted-foreground transition-colors hover:text-warning"
        aria-label={qr.isFavorite ? 'Unfavorite' : 'Favorite'}
      >
        <Star className={cn('h-4 w-4', qr.isFavorite && 'fill-warning text-warning')} />
      </button>

      <Link href={`/dashboard/qr-codes/${qr.id}`} className="mx-auto mb-3 mt-2">
        <QrThumbnail qr={qr} className="h-32 w-32" />
      </Link>

      <div className="flex-1 space-y-1.5">
        <Link
          href={`/dashboard/qr-codes/${qr.id}`}
          className="line-clamp-1 font-medium hover:underline"
        >
          {qr.name}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={qr.type === QrCodeType.DYNAMIC ? 'default' : 'secondary'}>
            {qr.type === QrCodeType.DYNAMIC ? 'Dynamic' : 'Static'}
          </Badge>
          <Badge variant="outline">{CONTENT_TYPE_LABELS[qr.contentType]}</Badge>
          {qr.isArchived && <Badge variant="outline">Archived</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatNumber(qr.totalScans)} scan{qr.totalScans === 1 ? '' : 's'} &middot; Updated{' '}
          {formatRelativeTime(qr.updatedAt)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/dashboard/qr-codes/${qr.id}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {qr.type === QrCodeType.DYNAMIC && qr.shortCode && (
              <DropdownMenuItem asChild>
                <a href={qr.encodedPayload} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open short link
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a href={apiDownloadUrl(`/qr-codes/${qr.id}/export`, { format: 'PNG' })}>
                <Download className="h-4 w-4" /> Download PNG
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleArchive}>
              {qr.isArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              {qr.isArchived ? 'Restore' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{qr.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the QR code
              {qr.type === QrCodeType.DYNAMIC ? ', its short link, and all scan history' : ''}. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
