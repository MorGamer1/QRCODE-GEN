'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, getFieldError } from './shared';

const PLATFORMS = [
  'instagram',
  'facebook',
  'twitter',
  'tiktok',
  'linkedin',
  'youtube',
  'snapchat',
  'telegram',
  'discord',
  'pinterest',
  'threads',
  'other',
] as const;

function label(platform: string): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

export function SocialFields({ prefix }: { prefix: string }) {
  const { register, control, formState } = useFormContext();
  const { errors } = formState;

  return (
    <div className="space-y-4">
      <Field id="c-platform" label="Platform">
        <Controller
          name={`${prefix}.platform`}
          control={control}
          defaultValue="instagram"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="c-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {label(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="c-url" label="Profile URL" error={getFieldError(errors, `${prefix}.url`)}>
        <Input
          id="c-url"
          type="url"
          placeholder="https://instagram.com/yourhandle"
          {...register(`${prefix}.url`)}
        />
      </Field>
      <Field
        id="c-displayName"
        label="Display name"
        optional
        error={getFieldError(errors, `${prefix}.displayName`)}
      >
        <Input
          id="c-displayName"
          placeholder="@yourhandle"
          {...register(`${prefix}.displayName`)}
        />
      </Field>
    </div>
  );
}
