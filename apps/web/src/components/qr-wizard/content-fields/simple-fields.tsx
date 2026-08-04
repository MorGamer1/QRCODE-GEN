'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, getFieldError } from './shared';

export function UrlFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  return (
    <Field id="c-url" label="Website URL" error={getFieldError(formState.errors, `${prefix}.url`)}>
      <Input id="c-url" type="url" placeholder="https://example.com" {...register(`${prefix}.url`)} />
    </Field>
  );
}

export function TextFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  return (
    <Field id="c-text" label="Text" error={getFieldError(formState.errors, `${prefix}.text`)}>
      <Textarea id="c-text" rows={5} placeholder="Anything you want to display" {...register(`${prefix}.text`)} />
    </Field>
  );
}

export function PhoneFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  return (
    <Field
      id="c-phone"
      label="Phone number"
      hint="Use international format, e.g. +14155551234"
      error={getFieldError(formState.errors, `${prefix}.phone`)}
    >
      <Input id="c-phone" type="tel" placeholder="+14155551234" {...register(`${prefix}.phone`)} />
    </Field>
  );
}
