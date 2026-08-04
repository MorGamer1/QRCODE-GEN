'use client';

import { Download } from 'lucide-react';
import { ExportFormat } from '@qrgen/shared';
import { apiDownloadUrl } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: ExportFormat.PNG, label: 'PNG' },
  { value: ExportFormat.SVG, label: 'SVG (vector)' },
  { value: ExportFormat.PDF, label: 'PDF' },
  { value: ExportFormat.WEBP, label: 'WebP' },
  { value: ExportFormat.EPS, label: 'EPS (print)' },
];

export function ExportMenu({ qrId }: { qrId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="h-4 w-4" /> Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {FORMATS.map((f) => (
          <DropdownMenuItem key={f.value} asChild>
            <a href={apiDownloadUrl(`/qr-codes/${qrId}/export`, { format: f.value })}>{f.label}</a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
