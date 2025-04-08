'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useActionState, useEffect, useState } from 'react';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { createBrowserClient } from '@/lib/supabase/client';

import { login } from '../actions';

export default function Page({
  searchParams,
}: { searchParams: Promise<{ signup?: string }> }) {
  const router = useRouter();
  const { set, stop } = useProgress();
  const { signup } = use(searchParams);

  const [email, setEmail] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace('chat/welcome');
      }
    };

    checkSession();
  }, [router]);

  const [{ error }, formAction] = useActionState<
    { error: string | null },
    FormData
  >(
    async (_, formData) => {
      try {
        const { error } = await login(formData);

        return {
          error: error.message,
        };
      } catch (error) {
        stop();
        return {
          error: 'An unexpected error occurred',
        };
      }
    },
    {
      error: null,
    },
  );

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    set(0.4);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-black-white-gradient">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col">
        <Image
          src="/images/automagik-logo-white.svg"
          alt="Automagik"
          width={540}
          height={160}
          className="z-10 aspect-[12/3] object-cover mb-10"
        />
        <AuthForm action={handleSubmit} defaultEmail={email}>
          {error && <span className="text-md text-destructive">{error}</span>}
          {signup && (
            <span className="text-md text-green-400">
              Check your email to confirm your account
            </span>
          )}
          <SubmitButton variant="gradient" className="rounded-full mt-4">
            Sign in
          </SubmitButton>
          <div className="flex flex-col items-center space-y-2 pt-2 text-sm">
            <Link
              href="/reset-password"
              className="text-accent-cyan hover:underline"
            >
              Reset Password
            </Link>
            <div className="text-foreground">
              Don&apos;t have one?{' '}
              <Link
                href="/register"
                className="text-accent-cyan hover:underline"
              >
                Sign up for free!
              </Link>
            </div>
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
