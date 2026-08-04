'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Archive, Star, Trash2, X } from 'lucide-react';
import type { BulkActionDto } from '@qrgen/shared';
import { useBulkQrAction } from '@/hooks/use-qr-codes';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
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

export function BulkActionsBar({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const bulkAction = useBulkQrAction();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const run = (action: BulkActionDto['action']) =>
    bulkAction.mutate(
      { ids: selectedIds, action },
      {
        onSuccess: (result) => {
          toast.success(`Updated ${result.affected} QR code${result.affected === 1 ? '' : 's'}`);
          onClear();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Bulk action failed'),
      },
    );

  const handleDelete = () =>
    bulkAction.mutate(
      { ids: selectedIds, action: 'delete' },
      {
        onSuccess: (result) => {
          toast.success(`Deleted ${result.affected} QR code${result.affected === 1 ? '' : 's'}`);
          setDeleteOpen(false);
          onClear();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Bulk delete failed'),
      },
    );

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="sticky top-16 z-20 flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <span className="text-sm font-medium">{selectedIds.length} selected</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={bulkAction.isPending} onClick={() => run('favorite')}>
            <Star className="h-3.5 w-3.5" /> Favorite
          </Button>
          <Button variant="outline" size="sm" disabled={bulkAction.isPending} onClick={() => run('archive')}>
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={bulkAction.isPending} onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} QR code{selectedIds.length === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes the selected QR codes and their scan history. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
