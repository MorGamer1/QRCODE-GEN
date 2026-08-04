'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Field, getFieldError, toDatetimeLocalValue, toIsoString } from './shared';

export function EventFields({ prefix }: { prefix: string }) {
  const { register, control, formState } = useFormContext();
  const { errors } = formState;
  const timezoneGuess = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;

  return (
    <div className="space-y-4">
      <Field id="c-title" label="Event title" error={getFieldError(errors, `${prefix}.title`)}>
        <Input id="c-title" placeholder="Product launch party" {...register(`${prefix}.title`)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="c-start" label="Starts" error={getFieldError(errors, `${prefix}.start`)}>
          <Controller
            name={`${prefix}.start`}
            control={control}
            render={({ field }) => (
              <Input
                id="c-start"
                type="datetime-local"
                value={toDatetimeLocalValue(field.value)}
                onChange={(e) => field.onChange(toIsoString(e.target.value))}
              />
            )}
          />
        </Field>
        <Field id="c-end" label="Ends" optional error={getFieldError(errors, `${prefix}.end`)}>
          <Controller
            name={`${prefix}.end`}
            control={control}
            render={({ field }) => (
              <Input
                id="c-end"
                type="datetime-local"
                value={toDatetimeLocalValue(field.value)}
                onChange={(e) => field.onChange(e.target.value ? toIsoString(e.target.value) : undefined)}
              />
            )}
          />
        </Field>
      </div>

      <Controller
        name={`${prefix}.allDay`}
        control={control}
        defaultValue={false}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox id="c-allDay" checked={field.value} onCheckedChange={field.onChange} />
            <Label htmlFor="c-allDay" className="font-normal">
              All-day event
            </Label>
          </div>
        )}
      />

      <Field id="c-location" label="Location" optional error={getFieldError(errors, `${prefix}.location`)}>
        <Input id="c-location" {...register(`${prefix}.location`)} />
      </Field>
      <Field id="c-description" label="Description" optional error={getFieldError(errors, `${prefix}.description`)}>
        <Textarea id="c-description" rows={3} {...register(`${prefix}.description`)} />
      </Field>
      <Field
        id="c-timezone"
        label="Timezone"
        optional
        hint={timezoneGuess ? `Defaults to your device's timezone (${timezoneGuess})` : undefined}
        error={getFieldError(errors, `${prefix}.timezone`)}
      >
        <Input id="c-timezone" placeholder={timezoneGuess ?? 'America/Los_Angeles'} {...register(`${prefix}.timezone`)} />
      </Field>
    </div>
  );
}
