'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { createBrowserClient } from '@/lib/supabase/client';
import { DataStatus } from '@/lib/data';

export default function Page() {
  const router = useRouter();
  const { set, stop } = useProgress();

  const [email, setEmail] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace('/');
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

        router.replace('/');

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
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          {errors._errors && (
            <span className="text-sm text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          <SubmitButton>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-2 dark:text-zinc-400">
            <Link
              href="/reset-password"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Forgot your password?
            </Link>
          </p>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
