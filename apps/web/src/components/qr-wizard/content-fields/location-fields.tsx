'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Field, getFieldError } from './shared';

export function LocationFields({ prefix }: { prefix: string }) {
  const { register, formState } = useFormContext();
  const { errors } = formState;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field id="c-latitude" label="Latitude" error={getFieldError(errors, `${prefix}.latitude`)}>
          <Input
            id="c-latitude"
            type="number"
            step="any"
            placeholder="37.7749"
            {...register(`${prefix}.latitude`, { valueAsNumber: true })}
          />
        </Field>
        <Field
          id="c-longitude"
          label="Longitude"
          error={getFieldError(errors, `${prefix}.longitude`)}
        >
          <Input
            id="c-longitude"
            type="number"
            step="any"
            placeholder="-122.4194"
            {...register(`${prefix}.longitude`, { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Field
        id="c-query"
        label="Place name"
        optional
        hint="Shown as the map label, e.g. a business or landmark name"
        error={getFieldError(errors, `${prefix}.query`)}
      >
        <Input id="c-query" placeholder="Golden Gate Bridge" {...register(`${prefix}.query`)} />
      </Field>
    </div>
  );
}
