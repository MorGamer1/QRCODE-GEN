'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { RedirectStatusCode } from '@qrgen/shared';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-admin';
import { ApiError } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminSettingsPage() {
  const { data: settings, isPending } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [form, setForm] = React.useState<{
    gdprStoreIp: boolean;
    gdprHashIp: boolean;
    defaultRedirectStatusCode: RedirectStatusCode;
    allowPublicRegistration: boolean;
    requireEmailVerification: boolean;
    maxQrCodesPerUser: string;
  } | null>(null);

  React.useEffect(() => {
    if (settings && !form) {
      setForm({
        gdprStoreIp: settings.gdprStoreIp,
        gdprHashIp: settings.gdprHashIp,
        defaultRedirectStatusCode: settings.defaultRedirectStatusCode as RedirectStatusCode,
        allowPublicRegistration: settings.allowPublicRegistration,
        requireEmailVerification: settings.requireEmailVerification,
        maxQrCodesPerUser: settings.maxQrCodesPerUser?.toString() ?? '',
      });
    }
  }, [settings, form]);

  if (isPending || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const save = () => {
    updateSettings.mutate(
      {
        gdprStoreIp: form.gdprStoreIp,
        gdprHashIp: form.gdprHashIp,
        defaultRedirectStatusCode: form.defaultRedirectStatusCode,
        allowPublicRegistration: form.allowPublicRegistration,
        requireEmailVerification: form.requireEmailVerification,
        maxQrCodesPerUser: form.maxQrCodesPerUser ? Number(form.maxQrCodesPerUser) : null,
      },
      {
        onSuccess: () => toast.success('Settings saved'),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Failed to save settings'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Control who can create an account on this server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Allow public registration"
            description="When off, only admins can create new accounts."
            checked={form.allowPublicRegistration}
            onChange={(v) => setForm({ ...form, allowPublicRegistration: v })}
          />
          <ToggleRow
            label="Require email verification"
            description="New accounts must verify their email before signing in."
            checked={form.requireEmailVerification}
            onChange={(v) => setForm({ ...form, requireEmailVerification: v })}
          />
          <div className="space-y-1.5">
            <Label htmlFor="maxQr">Max QR codes per user</Label>
            <Input
              id="maxQr"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.maxQrCodesPerUser}
              onChange={(e) => setForm({ ...form, maxQrCodesPerUser: e.target.value })}
              className="max-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy &amp; GDPR</CardTitle>
          <CardDescription>Control how much scanner information is retained.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Store scanner IP data"
            description="Look up device, browser, and geo location from the scanner's IP address."
            checked={form.gdprStoreIp}
            onChange={(v) => setForm({ ...form, gdprStoreIp: v })}
          />
          <ToggleRow
            label="Hash IP addresses"
            description="Store a one-way hash instead of the raw IP. The raw IP is never persisted either way."
            checked={form.gdprHashIp}
            onChange={(v) => setForm({ ...form, gdprHashIp: v })}
            disabled={!form.gdprStoreIp}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redirects</CardTitle>
          <CardDescription>Default behavior for new dynamic QR codes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Default redirect type</Label>
            <Select
              value={String(form.defaultRedirectStatusCode)}
              onValueChange={(v) =>
                setForm({ ...form, defaultRedirectStatusCode: Number(v) as RedirectStatusCode })
              }
            >
              <SelectTrigger className="max-w-xs">
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
        </CardContent>
      </Card>

      <Button onClick={save} disabled={updateSettings.isPending}>
        {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save settings
      </Button>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
