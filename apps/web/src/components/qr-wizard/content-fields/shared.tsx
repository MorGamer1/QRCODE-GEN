import type { FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';

/** Content field paths are built dynamically (`${prefix}.fieldName`), so lookups into
 * react-hook-form's nested `errors` object can't be statically typed per content type. */
export function getFieldError(errors: FieldErrors, path: string): string | undefined {
  let current: unknown = errors;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  const message = (current as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' ? message : undefined;
}

/** ISO datetime -> the local-time value a native `<input type="datetime-local">` expects. */
export function toDatetimeLocalValue(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The reverse: a datetime-local input's naive local value -> a real ISO string (UTC) for the API. */
export function toIsoString(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
