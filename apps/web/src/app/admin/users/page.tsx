'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, MoreVertical, Search, ShieldCheck, UserX } from 'lucide-react';
import { UserRole } from '@qrgen/shared';
import { useCurrentUser } from '@/hooks/use-auth';
import { useAdminUsers, useDeleteAdminUser, useUpdateAdminUser } from '@/hooks/use-admin';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

const ALL_ROLES = '__all__';
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { data: me } = useCurrentUser();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [searchDraft, setSearchDraft] = React.useState('');
  const [role, setRole] = React.useState<UserRole | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; email: string } | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setSearch(searchDraft), 300);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  const { data, isPending } = useAdminUsers({ page, pageSize: PAGE_SIZE, search: search || undefined, role });
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const changeRole = (id: string, newRole: UserRole) =>
    updateUser.mutate(
      { id, dto: { role: newRole } },
      {
        onSuccess: () => toast.success('Role updated'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update role'),
      },
    );

  const toggleSuspend = (id: string, isSuspended: boolean) =>
    updateUser.mutate(
      { id, dto: { isSuspended: !isSuspended } },
      {
        onSuccess: () => toast.success(isSuspended ? 'User unsuspended' : 'User suspended'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update user'),
      },
    );

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('User deleted');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete user'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Search by name or email" className="pl-8" />
        </div>
        <Select value={role ?? ALL_ROLES} onValueChange={(v) => setRole(v === ALL_ROLES ? undefined : (v as UserRole))}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            <SelectItem value={UserRole.USER}>User</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
            <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
          </SelectContent>
        </Select>
        {data && <span className="text-sm text-muted-foreground sm:ml-auto">{formatNumber(data.total)} users</span>}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QR codes</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending &&
              data?.items.map((user) => {
                const isSelf = user.id === me?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === UserRole.USER ? 'secondary' : 'default'}>{user.role.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isSuspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                    </TableCell>
                    <TableCell>{user._count.qrCodes}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSelf}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change role</DropdownMenuLabel>
                          {Object.values(UserRole).map((r) => (
                            <DropdownMenuItem key={r} disabled={r === user.role} onClick={() => changeRole(user.id, r)}>
                              <ShieldCheck className="h-4 w-4" /> {r.replace('_', ' ')}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleSuspend(user.id, user.isSuspended)}>
                            <UserX className="h-4 w-4" /> {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget({ id: user.id, email: user.email })}
                          >
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <AlertDialogTitle>Delete {deleteTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user and all of their QR codes, scan history, and API keys. This can&apos;t be undone.
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
