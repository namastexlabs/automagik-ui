'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from 'sonner';
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
        const { error } = await supabase.auth.signUp({
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

        toast.success('Check your email to confirm your account');
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
    try {
      setEmail(formData.get('email') as string);
      set(0.4);
      formAction(formData);
    } catch (error) {
      stop();
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          {errors._errors && (
            <span className="text-sm text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          <SubmitButton>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
