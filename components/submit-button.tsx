'use client';

import type { PropsWithChildren } from 'react';
import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

import { Button, type ButtonProps } from './ui/button';

export function SubmitButton({
  children,
  className,
  variant,
}: PropsWithChildren<{
  className?: string;
  variant?: ButtonProps['variant'];
}>) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending}
      disabled={pending}
      className={cn('relative', className)}
      variant={variant}
    >
      {children}

      {pending && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
