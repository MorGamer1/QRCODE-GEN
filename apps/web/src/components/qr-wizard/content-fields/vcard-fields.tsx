'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, getFieldError } from './shared';

export function VCardFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  const { errors } = formState;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="c-firstName"
          label="First name"
          error={getFieldError(errors, `${prefix}.firstName`)}
        >
          <Input id="c-firstName" {...register(`${prefix}.firstName`)} />
        </Field>
        <Field
          id="c-lastName"
          label="Last name"
          optional
          error={getFieldError(errors, `${prefix}.lastName`)}
        >
          <Input id="c-lastName" {...register(`${prefix}.lastName`)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="c-organization"
          label="Organization"
          optional
          error={getFieldError(errors, `${prefix}.organization`)}
        >
          <Input id="c-organization" {...register(`${prefix}.organization`)} />
        </Field>
        <Field
          id="c-title"
          label="Job title"
          optional
          error={getFieldError(errors, `${prefix}.title`)}
        >
          <Input id="c-title" {...register(`${prefix}.title`)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field id="c-phone" label="Phone" optional error={getFieldError(errors, `${prefix}.phone`)}>
          <Input
            id="c-phone"
            type="tel"
            placeholder="+14155551234"
            {...register(`${prefix}.phone`)}
          />
        </Field>
        <Field
          id="c-mobile"
          label="Mobile"
          optional
          error={getFieldError(errors, `${prefix}.mobile`)}
        >
          <Input
            id="c-mobile"
            type="tel"
            placeholder="+14155551234"
            {...register(`${prefix}.mobile`)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field id="c-email" label="Email" optional error={getFieldError(errors, `${prefix}.email`)}>
          <Input id="c-email" type="email" {...register(`${prefix}.email`)} />
        </Field>
        <Field
          id="c-website"
          label="Website"
          optional
          error={getFieldError(errors, `${prefix}.website`)}
        >
          <Input
            id="c-website"
            type="url"
            placeholder="https://example.com"
            {...register(`${prefix}.website`)}
          />
        </Field>
      </div>
      <Field
        id="c-address"
        label="Street address"
        optional
        error={getFieldError(errors, `${prefix}.address`)}
      >
        <Input id="c-address" {...register(`${prefix}.address`)} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field id="c-city" label="City" optional error={getFieldError(errors, `${prefix}.city`)}>
          <Input id="c-city" {...register(`${prefix}.city`)} />
        </Field>
        <Field
          id="c-postalCode"
          label="Postal code"
          optional
          error={getFieldError(errors, `${prefix}.postalCode`)}
        >
          <Input id="c-postalCode" {...register(`${prefix}.postalCode`)} />
        </Field>
        <Field
          id="c-country"
          label="Country"
          optional
          error={getFieldError(errors, `${prefix}.country`)}
        >
          <Input id="c-country" {...register(`${prefix}.country`)} />
        </Field>
      </div>
      <Field id="c-note" label="Note" optional error={getFieldError(errors, `${prefix}.note`)}>
        <Textarea id="c-note" rows={3} {...register(`${prefix}.note`)} />
      </Field>
      <Field
        id="c-photoUrl"
        label="Photo URL"
        optional
        hint="Paste a link to a hosted image"
        error={getFieldError(errors, `${prefix}.photoUrl`)}
      >
        <Input
          id="c-photoUrl"
          type="url"
          placeholder="https://example.com/photo.jpg"
          {...register(`${prefix}.photoUrl`)}
        />
      </Field>
    </div>
  );
}
