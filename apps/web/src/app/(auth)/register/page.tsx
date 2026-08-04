'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema } from '@qrgen/shared';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useRegister } from '@/hooks/use-auth';
import { useAuthConfig } from '@/hooks/use-auth-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AlertCircle, Loader2, MailCheck } from 'lucide-react';

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(1, 'Please confirm your password') })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const { data: authConfig, isPending: authConfigPending } = useAuthConfig();
  const [verificationEmail, setVerificationEmail] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const passwordValue = watch('password');

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    try {
      const result = await register.mutateAsync({ name, email, password });
      if (result.requiresEmailVerification) {
        setVerificationEmail(email);
        return;
      }
      toast.success('Account created');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Something went wrong. Please try again.');
    }
  });

  if (verificationEmail) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent a verification link to <span className="font-medium text-foreground">{verificationEmail}</span>.
            Follow it to activate your account, then sign in.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!authConfigPending && authConfig && !authConfig.allowPublicRegistration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registration closed</CardTitle>
          <CardDescription>This server isn&apos;t accepting new accounts right now. Ask an administrator for an invite.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start generating and tracking QR codes in minutes.</CardDescription>
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
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" placeholder="Jane Doe" disabled={register.isPending} {...registerField('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={register.isPending}
              {...registerField('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" disabled={register.isPending} {...registerField('password')} />
            <PasswordRequirements value={passwordValue ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={register.isPending}
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <OAuthButtons />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
