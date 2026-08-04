'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useCreateCategory } from '@/hooks/use-categories';
import { ApiError } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const NONE_VALUE = '__none__';

export function CategorySelect({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const category = await createCategory.mutateAsync({ name: name.trim() });
      onChange(category.id);
      setName('');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={value ?? NONE_VALUE} onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}>
        <SelectTrigger>
          <SelectValue placeholder="No category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>No category</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="New category">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-category-name">Name</Label>
            <Input
              id="new-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreate} disabled={!name.trim() || createCategory.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
