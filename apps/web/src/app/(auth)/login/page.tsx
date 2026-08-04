'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@qrgen/shared';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/auth/password-input';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AuthCardSkeleton } from '@/components/auth/auth-card-skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';

function safeRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  return path;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const login = useLogin();

  const [needsTwoFactor, setNeedsTwoFactor] = React.useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  React.useEffect(() => {
    if (needsTwoFactor) setFocus(useRecoveryCode ? 'recoveryCode' : 'twoFactorCode');
  }, [needsTwoFactor, useRecoveryCode, setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await login.mutateAsync(values);
      if (result.twoFactorRequired) {
        setNeedsTwoFactor(true);
        return;
      }
      toast.success('Welcome back');
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Something went wrong. Please try again.');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          {needsTwoFactor
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Welcome back. Enter your credentials to continue.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {!needsTwoFactor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={login.isPending}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  disabled={login.isPending}
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </>
          )}

          {needsTwoFactor && (
            <div className="space-y-2">
              <Label htmlFor="twoFactorField">{useRecoveryCode ? 'Recovery code' : 'Authentication code'}</Label>
              {useRecoveryCode ? (
                <Input
                  id="twoFactorField"
                  autoComplete="one-time-code"
                  placeholder="xxxxxxxx"
                  disabled={login.isPending}
                  {...register('recoveryCode')}
                />
              ) : (
                <Input
                  id="twoFactorField"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center text-lg tracking-[0.5em]"
                  disabled={login.isPending}
                  {...register('twoFactorCode')}
                />
              )}
              {(errors.twoFactorCode || errors.recoveryCode) && (
                <p className="text-xs text-destructive">{errors.twoFactorCode?.message ?? errors.recoveryCode?.message}</p>
              )}
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setUseRecoveryCode((v) => !v)}
              >
                {useRecoveryCode ? 'Use an authentication code instead' : 'Use a recovery code instead'}
              </button>
            </div>
          )}

          {!needsTwoFactor && <OAuthButtons />}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {needsTwoFactor ? 'Verify' : 'Sign in'}
          </Button>
          {!needsTwoFactor && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
