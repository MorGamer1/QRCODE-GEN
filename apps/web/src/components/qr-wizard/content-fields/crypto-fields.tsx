'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, getFieldError } from './shared';

const CURRENCIES = ['BTC', 'ETH', 'LTC', 'BCH', 'XRP', 'DOGE', 'SOL', 'USDT'] as const;

export function CryptoFields({ prefix }: { prefix: string }) {
  const { register, control, formState } = useFormContext();
  const { errors } = formState;

  return (
    <div className="space-y-4">
      <Field id="c-currency" label="Currency">
        <Controller
          name={`${prefix}.currency`}
          control={control}
          defaultValue="BTC"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="c-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="c-address" label="Wallet address" error={getFieldError(errors, `${prefix}.address`)}>
        <Input id="c-address" className="font-mono" placeholder="bc1q..." {...register(`${prefix}.address`)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="c-amount" label="Amount" optional error={getFieldError(errors, `${prefix}.amount`)}>
          <Input
            id="c-amount"
            type="number"
            step="any"
            min={0}
            placeholder="0.01"
            {...register(`${prefix}.amount`, { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
          />
        </Field>
        <Field id="c-message" label="Message" optional error={getFieldError(errors, `${prefix}.message`)}>
          <Input id="c-message" placeholder="Payment note" {...register(`${prefix}.message`)} />
        </Field>
      </div>
    </div>
  );
}
