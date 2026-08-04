'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RedirectStatusCode, type RedirectSettingsDto } from '@qrgen/shared';
import { ApiError } from '@/lib/api-client';
import { useUpdateRedirectSettings } from '@/hooks/use-qr-codes';
import type { QrCode } from '@/lib/qr-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toDatetimeLocalValue, toIsoString } from './content-fields/shared';
import { Loader2 } from 'lucide-react';

interface FormValues {
  statusCode: RedirectStatusCode;
  scanLimit: string;
  activateAt: string;
  deactivateAt: string;
  expiresAt: string;
  changePassword: boolean;
  password: string;
  removePassword: boolean;
}

export function RedirectSettingsForm({ qr }: { qr: QrCode }) {
  const updateSettings = useUpdateRedirectSettings(qr.id);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      statusCode: qr.redirectStatusCode as RedirectStatusCode,
      scanLimit: qr.scanLimit?.toString() ?? '',
      activateAt: toDatetimeLocalValue(qr.activateAt),
      deactivateAt: toDatetimeLocalValue(qr.deactivateAt),
      expiresAt: toDatetimeLocalValue(qr.expiresAt),
      changePassword: false,
      password: '',
      removePassword: false,
    },
  });
  const changePassword = watch('changePassword');

  const onSubmit = handleSubmit(async (values) => {
    const dto: RedirectSettingsDto = {
      statusCode: values.statusCode,
      scanLimit: values.scanLimit ? Number(values.scanLimit) : null,
      activateAt: values.activateAt ? toIsoString(values.activateAt) : null,
      deactivateAt: values.deactivateAt ? toIsoString(values.deactivateAt) : null,
      expiresAt: values.expiresAt ? toIsoString(values.expiresAt) : null,
      ...(values.removePassword
        ? { password: null }
        : values.changePassword && values.password
          ? { password: values.password }
          : {}),
    };
    try {
      await updateSettings.mutateAsync(dto);
      toast.success('Redirect settings saved');
      reset({ ...values, changePassword: false, password: '', removePassword: false });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save redirect settings');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirect settings</CardTitle>
        <CardDescription>
          These control where and how this QR code&apos;s short link behaves. They apply instantly -
          the printed QR image never needs to change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rs-status">Redirect type</Label>
              <Select
                value={String(watch('statusCode'))}
                onValueChange={(v) => setValue('statusCode', Number(v) as RedirectStatusCode)}
              >
                <SelectTrigger id="rs-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(RedirectStatusCode.FOUND)}>
                    302 - Found (temporary)
                  </SelectItem>
                  <SelectItem value={String(RedirectStatusCode.MOVED_PERMANENTLY)}>
                    301 - Moved permanently
                  </SelectItem>
                  <SelectItem value={String(RedirectStatusCode.TEMPORARY_REDIRECT)}>
                    307 - Temporary redirect (strict)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-scanLimit">Scan limit</Label>
              <Input
                id="rs-scanLimit"
                type="number"
                min={1}
                placeholder="Unlimited"
                {...register('scanLimit')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="rs-activateAt">Activates at</Label>
              <Input id="rs-activateAt" type="datetime-local" {...register('activateAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-deactivateAt">Deactivates at</Label>
              <Input id="rs-deactivateAt" type="datetime-local" {...register('deactivateAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-expiresAt">Expires at</Label>
              <Input id="rs-expiresAt" type="datetime-local" {...register('expiresAt')} />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Password protection</span>
              <span className="text-xs text-muted-foreground">
                {qr.hasPassword ? 'Currently enabled' : 'Currently disabled'}
              </span>
            </div>
            {qr.hasPassword && !changePassword && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('changePassword', true)}
                >
                  Change password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('removePassword', true);
                    setValue('changePassword', false);
                  }}
                >
                  Remove password
                </Button>
              </div>
            )}
            {!qr.hasPassword && !changePassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('changePassword', true)}
              >
                Set a password
              </Button>
            )}
            {changePassword && (
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="New password (min 4 characters)"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('changePassword', false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            {watch('removePassword') && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Password will be removed when you save.</span>
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setValue('removePassword', false)}
                >
                  Undo
                </button>
              </div>
            )}
          </div>

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save redirect settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
