'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useAuditLogs } from '@/hooks/use-admin';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAGE_SIZE = 25;

function actionTone(action: string): 'default' | 'destructive' | 'secondary' | 'success' {
  if (action.includes('DELETED') || action.includes('FAILED') || action.includes('SUSPENDED')) return 'destructive';
  if (action.includes('CREATED') || action.includes('ENABLED')) return 'success';
  return 'secondary';
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = React.useState(1);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const { data, isPending } = useAuditLogs({ page, pageSize: PAGE_SIZE });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && (data?.items.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No audit log entries yet.
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              data?.items.map((entry) => (
                <React.Fragment key={entry.id}>
                  <TableRow
                    className={entry.metadata ? 'cursor-pointer' : undefined}
                    onClick={() => entry.metadata && setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                    <TableCell className="text-xs">{entry.user ? `${entry.user.name} (${entry.user.email})` : 'System'}</TableCell>
                    <TableCell>
                      <Badge variant={actionTone(entry.action)}>{entry.action.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.entityType ? `${entry.entityType}${entry.entityId ? ` #${entry.entityId.slice(0, 8)}` : ''}` : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.metadata &&
                        (expanded === entry.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ))}
                    </TableCell>
                  </TableRow>
                  {expanded === entry.id && entry.metadata && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <pre className="overflow-x-auto text-xs">{JSON.stringify(entry.metadata, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
    </div>
  );
}
