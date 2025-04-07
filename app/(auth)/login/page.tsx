'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { createBrowserClient } from '@/lib/supabase/client';
import { DataStatus } from '@/lib/data';

export default function Page() {
  const router = useRouter();
  const { set, stop } = useProgress();
  const searchParams = useSearchParams();

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

  const [{ errors = {} }, formAction] = useActionState<
    { status: DataStatus; errors?: { _errors?: string[] } },
    FormData
  >(
    async (_, formData) => {
      const supabase = createBrowserClient();
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        });

        if (error) {
          stop();
          return {
            status: DataStatus.InvalidData,
            errors: { _errors: [error.message] },
          };
        }

        router.replace('/chat/welcome');

        return { status: DataStatus.Success };
      } catch (error) {
        stop();
        return {
          status: DataStatus.Unexpected,
          errors: { _errors: ['An unexpected error occurred'] },
        };
      }
    },
    {
      status: DataStatus.Success,
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
          {errors._errors && (
            <span className="text-md text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          {searchParams.get('signup') && (
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
              <Link href="/register" className="text-accent-cyan hover:underline">
                Sign up for free!
              </Link>
            </div>
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
