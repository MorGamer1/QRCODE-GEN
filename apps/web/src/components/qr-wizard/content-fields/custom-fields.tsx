'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, getFieldError } from './shared';

export function CustomFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  const { errors } = formState;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        A simple landing page for cases the other content types don&apos;t cover. For structured
        key/value payloads, use the API directly.
      </p>
      <Field id="c-title" label="Title" optional error={getFieldError(errors, `${prefix}.title`)}>
        <Input id="c-title" {...register(`${prefix}.title`)} />
      </Field>
      <Field id="c-body" label="Body text" optional error={getFieldError(errors, `${prefix}.body`)}>
        <Textarea id="c-body" rows={4} {...register(`${prefix}.body`)} />
      </Field>
      <Field
        id="c-redirectUrl"
        label="Redirect URL"
        optional
        hint="If set, visitors are sent straight here instead of seeing a landing page"
        error={getFieldError(errors, `${prefix}.redirectUrl`)}
      >
        <Input
          id="c-redirectUrl"
          type="url"
          placeholder="https://example.com"
          {...register(`${prefix}.redirectUrl`)}
        />
      </Field>
    </div>
  );
}
