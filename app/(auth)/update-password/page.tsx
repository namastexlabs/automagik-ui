'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useActionState, useEffect } from 'react';
import Form from 'next/form';
import { useProgress } from '@bprogress/next';

import { createBrowserClient } from '@/lib/supabase/client';
import { SubmitButton } from '@/components/submit-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DataStatus } from '@/lib/data';

export default function Page() {
  const router = useRouter();
  const { set, stop } = useProgress();

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
        const supabase = createBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          stop();
          return {
            status: DataStatus.InvalidData,
            errors: { _errors: ['User not found'] },
          };
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          stop();
          return {
            status: DataStatus.Unexpected,
            errors: { _errors: ['Failed to update password'] },
          };
        }

        toast.success('Password updated successfully');
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
    { status: DataStatus.Success },
  );

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Update Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password
          </p>
        </div>
        <Form action={formAction} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Password
            </Label>

            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Confirm Password
            </Label>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
            />
          </div>
          {errors._errors && (
            <span className="text-sm text-destructive">
              {errors._errors.join(', ')}
            </span>
          )}
          <SubmitButton>Update Password</SubmitButton>
        </Form>
      </div>
    </div>
  );
}
