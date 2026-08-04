'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@qrgen/shared';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useResetPassword } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { AuthCardSkeleton } from '@/components/auth/auth-card-skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';

const resetFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1, 'Please confirm your password') })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type ResetFormValues = z.infer<typeof resetFormSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });
  const passwordValue = watch('password');

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing its token. Request a new one below.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ token, password });
      toast.success('Password updated. Please sign in again.');
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Something went wrong. Please try again.');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you haven&apos;t used before.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              disabled={resetPassword.isPending}
              {...register('password')}
            />
            <PasswordRequirements value={passwordValue ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={resetPassword.isPending}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
            {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
