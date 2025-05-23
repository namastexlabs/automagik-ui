'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { resetPassword } from '../actions';

export default function Page() {
  const { set, stop } = useProgress();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    setEmail(email);
    set(0.4);

    try {
      const data = await resetPassword(email);

      if (data?.error) {
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
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-black-white-gradient">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold text-muted-foreground">
              Check your email
            </h3>
            <p className="text-sm text-muted-foreground">
              We have sent a password reset link to {email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-black-white-gradient">
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
