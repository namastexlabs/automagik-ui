'use client';

import { toast } from 'sonner';
import { useActionState } from 'react';
import Form from 'next/form';
import { useProgress } from '@bprogress/next';
import Image from 'next/image';

import { SubmitButton } from '@/components/submit-button';
import { DataStatus } from '@/lib/data';
import { FloatingLabelInput } from '@/components/ui/floating-input';

import { updatePassword } from '../actions';

export default function Page() {
  const { set, stop } = useProgress();
  const [{ errors = {} }, formAction] = useActionState<
    { status: DataStatus; errors?: { _errors?: string[] } },
    FormData
  >(
    async (_, formData: FormData) => {
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        return {
          status: DataStatus.InvalidData,
          errors: { _errors: ['Passwords do not match'] },
        };
      }

      set(0.4);
      try {
        const { error } = await updatePassword(password);
        console.log(error);

        if (error) {
          stop();
          return {
            status: DataStatus.Unexpected,
            errors: { _errors: ['Failed to update password'] },
          };
        }

        toast.success('Password updated successfully');
        return { status: DataStatus.Success };
      } catch (error) {
        stop();
        return {
          status: DataStatus.Unexpected,
          errors: { _errors: ['An unexpected error occurred'] },
        };
      }
    },
    { status: DataStatus.Success },
  );

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
        <Form action={formAction} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-8">
            <FloatingLabelInput
              id="password"
              name="password"
              type="password"
              label="Password"
              required
            />
            <FloatingLabelInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              required
            />
          </div>
          {errors._errors && (
            <span className="text-sm text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          <SubmitButton variant="outline" className="rounded-full mt-4">
            Update Password
          </SubmitButton>
        </Form>
      </div>
    </div>
  );
}
