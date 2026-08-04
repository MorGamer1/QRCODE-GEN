import { BarChart3 } from 'lucide-react';

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
