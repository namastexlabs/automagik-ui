'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { createBrowserClient } from '@/lib/supabase/client';

export default function Page() {
  const { set, stop } = useProgress();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    setEmail(email);
    set(0.4);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error('Failed to send reset password email');
        stop();
        return;
      }

      setSubmitted(true);
      stop();
    } catch (error) {
      toast.error('An unexpected error occurred');
      stop();
    }
  };

  if (submitted) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-accent bg-gradient-to-tl from-accent from-40% to-white/15">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold dark:text-zinc-50">
              Check your email
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              We have sent a password reset link to {email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-accent bg-gradient-to-tl from-accent to-white/10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <Image
          src="/images/automagik-logo-white.svg"
          alt="Automagik"
          width={540}
          height={160}
          className="z-10 aspect-[12/3] object-cover mb-10"
        />
        <AuthForm action={handleSubmit} defaultEmail={email} hidePassword>
          <SubmitButton className="rounded-full mt-4" variant="outline">
            Send Reset Link
          </SubmitButton>
          <p className="text-center text-sm mt-4">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-accent-cyan"
            >
              Sign in
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
