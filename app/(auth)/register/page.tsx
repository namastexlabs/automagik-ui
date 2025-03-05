'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { useProgress } from '@bprogress/next';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';

export default function Page() {
  const router = useRouter();
  const { set, stop } = useProgress();

  const [email, setEmail] = useState('');

  const [, formAction] = useActionState<RegisterActionState, FormData>(
    async (state, formData) => {
      const newState = await register(state, formData);

      if (newState.status !== 'success') {
        stop();
        router.refresh();
      }
      switch (newState.status) {
        case 'user_exists':
          toast.error('An account with this email already exists');
          break;
        case 'invalid_email':
          toast.error('Please enter a valid email address');
          break;
        case 'weak_password':
          toast.error(
            'Password is too weak. It should be at least 6 characters long',
          );
          break;
        case 'failed':
          toast.error('Failed to create account. Please try again');
          break;
        case 'invalid_data':
          toast.error('Please check your input and try again');
          break;
        case 'success':
          toast.success('Check your email to confirm your account');
          router.push('/login');
          break;
      }

      return newState;
    },
    {
      status: 'idle',
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
