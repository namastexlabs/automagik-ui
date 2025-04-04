'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useProgress } from '@bprogress/next';
import Image from 'next/image';

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
        router.replace('/chat');
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
        const email = formData.get('email') as string;
        const { error } = await supabase.auth.signUp({
          email,
          password: formData.get('password') as string,
          options: {
            emailRedirectTo: `${window.location.origin}/chat/welcome`,
          },
        });

        if (error) {
          stop();
          return {
            status: DataStatus.InvalidData,
            errors: {
              _errors: [
                email.includes('@automagik.ai')
                  ? error.message
                  : 'Invalid email',
              ],
            },
          };
        }

        toast.success('Check your email to confirm your account');
        router.replace('/login');

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
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-accent bg-gradient-to-tl from-accent to-light-gray/10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <Image
          src="/images/automagik-logo-white.svg"
          alt="Automagik"
          width={540}
          height={160}
          className="z-10 aspect-[12/3] object-cover mb-10"
        />
        <AuthForm action={handleSubmit} defaultEmail={email}>
          {errors._errors && (
            <span className="text-sm text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          <SubmitButton variant="gradient" className="rounded-full">
            Sign Up
          </SubmitButton>
          <p className="text-center text-sm mt-4">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-accent-cyan hover:underline"
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
