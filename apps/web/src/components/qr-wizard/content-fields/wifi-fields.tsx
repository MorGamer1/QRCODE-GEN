'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PasswordInput } from '@/components/auth/password-input';
import { Field, getFieldError } from './shared';

const ENCRYPTION_OPTIONS = [
  { value: 'WPA', label: 'WPA/WPA2/WPA3' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'No password' },
];

export function WifiFields({ prefix }: { prefix: string }) {
  const { register, control, watch, formState } = useFormContext();
  const { errors } = formState;
  const encryption = watch(`${prefix}.encryption`) ?? 'WPA';

  return (
    <div className="space-y-4">
      <Field
        id="c-ssid"
        label="Network name (SSID)"
        error={getFieldError(errors, `${prefix}.ssid`)}
      >
        <Input id="c-ssid" placeholder="My Wi-Fi Network" {...register(`${prefix}.ssid`)} />
      </Field>

      <Field id="c-encryption" label="Security">
        <Controller
          name={`${prefix}.encryption`}
          control={control}
          defaultValue="WPA"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="c-encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCRYPTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {encryption !== 'nopass' && (
        <Field
          id="c-wifi-password"
          label="Password"
          error={getFieldError(errors, `${prefix}.password`)}
        >
          <PasswordInput id="c-wifi-password" {...register(`${prefix}.password`)} />
        </Field>
      )}

      <Controller
        name={`${prefix}.hidden`}
        control={control}
        defaultValue={false}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox id="c-hidden" checked={field.value} onCheckedChange={field.onChange} />
            <Label htmlFor="c-hidden" className="font-normal">
              This network is hidden
            </Label>
          </div>
        )}
      />
    </div>
  );
}
