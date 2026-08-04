import { Check, X } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from '@qrgen/shared';
import { cn } from '@/lib/utils';

const RULES: { label: string; test: (v: string) => boolean }[] = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /[0-9]/.test(v) },
];

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
      {RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-1.5',
              met ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 opacity-40" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
