'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Database, Download, Loader2, Trash2 } from 'lucide-react';
import { useBackups, useCreateBackup, useDeleteBackup, backupDownloadUrl } from '@/hooks/use-admin';
import { ApiError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function AdminBackupsPage() {
  const { data: backups, isPending } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const handleCreate = () =>
    createBackup.mutate(undefined, {
      onSuccess: () => toast.success('Backup created'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Backup failed'),
    });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBackup.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success('Backup deleted');
        setDeleteTarget(null);
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : 'Failed to delete backup'),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Database backups</CardTitle>
          <CardDescription>
            On-demand pg_dump snapshots, stored on the server&apos;s backup volume.
          </CardDescription>
        </div>
        <Button onClick={handleCreate} disabled={createBackup.isPending}>
          {createBackup.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Create backup
        </Button>
      </CardHeader>
      <CardContent>
        {isPending && <Skeleton className="h-48 w-full" />}
        {!isPending && (backups?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Database className="h-8 w-8" />
            <p className="text-sm">No backups yet. Create one to get started.</p>
          </div>
        )}
        {!isPending && backups && backups.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.fileName}>
                    <TableCell className="font-mono text-xs">{backup.fileName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatBytes(backup.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(backup.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={backupDownloadUrl(backup.fileName)}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(backup.fileName)}
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
        )}
      </CardContent>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget} will be permanently removed from the server. This can&apos;t be undone.
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
    </Card>
  );
}
