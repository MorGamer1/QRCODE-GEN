'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, getFieldError } from './shared';

export function EmailFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  const { errors } = formState;
  return (
    <div className="space-y-4">
      <Field id="c-to" label="Recipient email" error={getFieldError(errors, `${prefix}.to`)}>
        <Input
          id="c-to"
          type="email"
          placeholder="hello@example.com"
          {...register(`${prefix}.to`)}
        />
      </Field>
      <Field
        id="c-subject"
        label="Subject"
        optional
        error={getFieldError(errors, `${prefix}.subject`)}
      >
        <Input id="c-subject" placeholder="Subject line" {...register(`${prefix}.subject`)} />
      </Field>
      <Field id="c-body" label="Message" optional error={getFieldError(errors, `${prefix}.body`)}>
        <Textarea
          id="c-body"
          rows={4}
          placeholder="Pre-filled message body"
          {...register(`${prefix}.body`)}
        />
      </Field>
    </div>
  );
}

function PhoneAndMessage({
  prefix,
  messageLabel,
  messageMax,
}: {
  prefix: string;
  messageLabel: string;
  messageMax: number;
}) {
  const { register, formState } = useFormContext();
  const { errors } = formState;
  return (
    <div className="space-y-4">
      <Field
        id="c-phone"
        label="Phone number"
        hint="Use international format, e.g. +14155551234"
        error={getFieldError(errors, `${prefix}.phone`)}
      >
        <Input
          id="c-phone"
          type="tel"
          placeholder="+14155551234"
          {...register(`${prefix}.phone`)}
        />
      </Field>
      <Field
        id="c-message"
        label={messageLabel}
        optional
        hint={`Up to ${messageMax} characters`}
        error={getFieldError(errors, `${prefix}.message`)}
      >
        <Textarea id="c-message" rows={3} {...register(`${prefix}.message`)} />
      </Field>
    </div>
  );
}

export function SmsFields({ prefix }: { prefix: string }) {
  return <PhoneAndMessage prefix={prefix} messageLabel="Pre-filled message" messageMax={918} />;
}

export function WhatsappFields({ prefix }: { prefix: string }) {
  return <PhoneAndMessage prefix={prefix} messageLabel="Pre-filled message" messageMax={2000} />;
}
