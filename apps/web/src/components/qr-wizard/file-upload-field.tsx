'use client';

import * as React from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadFile, type FileUploadPurpose } from '@/hooks/use-files';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadFieldProps {
  purpose: FileUploadPurpose;
  accept: string[];
  maxSizeBytes: number;
  value: string | null;
  fileName?: string | null;
  onChange: (fileId: string | null, meta?: { fileName: string; dataUri?: string }) => void;
  helperText?: string;
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FileUploadField({ purpose, accept, maxSizeBytes, value, fileName, onChange, helperText }: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const upload = useUploadFile();

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!accept.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > maxSizeBytes) {
      toast.error(`File exceeds the ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`);
      return;
    }

    try {
      const dataUri = purpose === 'logo' ? await readAsDataUri(file) : undefined;
      const asset = await upload.mutateAsync({ file, purpose });
      onChange(asset.id, { fileName: asset.originalName, dataUri });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{fileName ?? 'Uploaded file'}</span>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-input',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {upload.isPending ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-6 w-6 text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground">
        <button type="button" className="font-medium text-primary hover:underline" onClick={() => inputRef.current?.click()}>
          Click to upload
        </button>{' '}
        or drag and drop
      </p>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
