'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Field, getFieldError } from './shared';

export function AppStoreFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  const { errors } = formState;
  const rootError = getFieldError(errors, prefix) ?? getFieldError(errors, `${prefix}._errors.0`);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Provide at least one store link. Visitors are routed to the right one automatically based on
        their device.
      </p>
      {rootError && <p className="text-xs text-destructive">{rootError}</p>}
      <Field
        id="c-title"
        label="App name"
        optional
        error={getFieldError(errors, `${prefix}.title`)}
      >
        <Input id="c-title" placeholder="My App" {...register(`${prefix}.title`)} />
      </Field>
      <Field
        id="c-iosUrl"
        label="iOS App Store URL"
        optional
        error={getFieldError(errors, `${prefix}.iosUrl`)}
      >
        <Input
          id="c-iosUrl"
          type="url"
          placeholder="https://apps.apple.com/..."
          {...register(`${prefix}.iosUrl`)}
        />
      </Field>
      <Field
        id="c-androidUrl"
        label="Google Play URL"
        optional
        error={getFieldError(errors, `${prefix}.androidUrl`)}
      >
        <Input
          id="c-androidUrl"
          type="url"
          placeholder="https://play.google.com/..."
          {...register(`${prefix}.androidUrl`)}
        />
      </Field>
      <Field
        id="c-fallbackUrl"
        label="Fallback URL"
        optional
        hint="Used for desktop visitors or unsupported devices"
        error={getFieldError(errors, `${prefix}.fallbackUrl`)}
      >
        <Input
          id="c-fallbackUrl"
          type="url"
          placeholder="https://example.com"
          {...register(`${prefix}.fallbackUrl`)}
        />
      </Field>
    </div>
  );
}
