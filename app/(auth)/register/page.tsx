'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { useProgress } from '@bprogress/next';
import Image from 'next/image';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { signup } from '../actions';

export default function Page() {
  const router = useRouter();
  const { set, stop } = useProgress();

  const [email, setEmail] = useState('');

  const [{ error }, formAction] = useActionState<
    { error: string | null },
    FormData
  >(
    async (_, formData) => {
      setEmail(formData.get('email') as string);
      try {
        set(0.4);
        const { error } = await signup(formData);

        return {
          error: error?.message || 'An unexpected error occurred',
        };
      } catch (error) {
        console.error('Registration error:', error);
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

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-black-white-gradient">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <Image
          src="/images/automagik-logo-white.svg"
          alt="Automagik"
          width={540}
          height={160}
          className="z-10 aspect-[12/3] object-cover mb-10"
        />
        <AuthForm action={formAction} defaultEmail={email}>
          {error && (
            <span className="text-sm text-destructive">
              {error}
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
