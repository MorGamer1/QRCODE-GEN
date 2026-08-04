'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ExternalLink, Search, Trash2 } from 'lucide-react';
import { QrCodeType } from '@qrgen/shared';
import { useAdminQrCodes, useDeleteAdminQrCode } from '@/hooks/use-admin';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

const PAGE_SIZE = 20;

export default function AdminQrCodesPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [searchDraft, setSearchDraft] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setSearch(searchDraft), 300);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  const { data, isPending } = useAdminQrCodes({ page, pageSize: PAGE_SIZE, search: search || undefined });
  const deleteQr = useDeleteAdminQrCode();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteQr.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('QR code deleted');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Search by name or short code" className="pl-8" />
        </div>
        {data && <span className="text-sm text-muted-foreground sm:ml-auto">{formatNumber(data.total)} QR codes</span>}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scans</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending &&
              data?.items.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">{qr.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {qr.user.name} &middot; {qr.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={qr.type === QrCodeType.DYNAMIC ? 'default' : 'secondary'}>
                      {qr.type === QrCodeType.DYNAMIC ? 'Dynamic' : 'Static'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNumber(qr.totalScans)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(qr.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/qr-codes/${qr.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: qr.id, name: qr.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the QR code, its short link, and all scan history for its owner. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
