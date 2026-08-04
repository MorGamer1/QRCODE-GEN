'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useVerifyEmail } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCardSkeleton } from '@/components/auth/auth-card-skeleton';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const verifyEmail = useVerifyEmail();
  const attempted = React.useRef(false);

  React.useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <StatusCard
        icon={<XCircle className="h-6 w-6" />}
        title="Invalid link"
        description="This verification link is missing its token."
      />
    );
  }

  if (verifyEmail.isPending || verifyEmail.isIdle) {
    return (
      <StatusCard
        icon={<Loader2 className="h-6 w-6 animate-spin" />}
        title="Verifying your email"
        description="Just a moment..."
      />
    );
  }

  if (verifyEmail.isError) {
    const message = verifyEmail.error instanceof ApiError ? verifyEmail.error.message : 'This link is invalid or has expired.';
    return <StatusCard icon={<XCircle className="h-6 w-6" />} title="Verification failed" description={message} tone="destructive" />;
  }

  return (
    <StatusCard
      icon={<CheckCircle2 className="h-6 w-6" />}
      title="Email verified"
      description="Your account is now active. You can sign in."
      tone="success"
    />
  );
}

function StatusCard({
  icon,
  title,
  description,
  tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'destructive';
}) {
  const toneClass = tone === 'success' ? 'bg-success/10 text-success' : tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary';
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>{icon}</div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
