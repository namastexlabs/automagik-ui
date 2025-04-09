'use client';

import { useActionState, useState, type PropsWithChildren } from 'react';
import { useProgress } from '@bprogress/next';

import type { ButtonProps } from '@/components/ui/button';
import type { InputProps } from '@/components/ui/floating-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataStatus } from '@/lib/data';
import { joinWaitlistAction } from '@/app/(marketing)/actions';
import { cn } from '@/lib/utils';
import { SubmitButton } from '@/components/submit-button';

const WaitListInput = ({ className, ...props }: InputProps) => {
  return (
    <Input
      {...props}
      className={cn(
        'w-full border border-dark-gray rounded-full p-6 md:text-xl text-foreground',
        className,
      )}
    />
  );
};
export const WaitlistForm = () => {
  const { set, stop } = useProgress();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [{ status, errors = {} }, formAction] = useActionState<
    Awaited<ReturnType<typeof joinWaitlistAction>>,
    FormData
  >(
    async (state, formData) => {
      set(0.4);
      const result = await joinWaitlistAction(state, formData);
      setHasSubmitted(true);
      stop();

      return result;
    },
    { status: DataStatus.Success, data: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <WaitListInput
          type="text"
          name="name"
          placeholder="Your name"
          required
        />
        {errors.name && (
          <span className="text-md text-red-400">{errors.name.join(', ')}</span>
        )}
      </div>
      <div>
        <WaitListInput
          type="email"
          name="email"
          placeholder="Your best e-mail"
          required
        />
        {errors.email && (
          <span className="text-md text-red-400">
            {errors.email.join(', ')}
          </span>
        )}
      </div>
      {errors._errors && (
        <p className="text-md text-red-400">{errors._errors.join(', ')}</p>
      )}
      {hasSubmitted && status === DataStatus.Success && (
        <p className="text-md text-green-400">
          You&apos;ve been added to the waitlist!
        </p>
      )}
      <GradientButton type="submit" className="w-full">
        JOIN THE WAITLIST
      </GradientButton>
    </form>
  );
};

export const GradientText = ({
  children,
  variant = '1',
  className = '',
}: {
  children: React.ReactNode;
  variant?: '1' | '2';
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'text-gradient',
        variant === '2' && 'text-gradient-2',
        className,
      )}
    >
      {children}
    </span>
  );
};

export const FeatureContainer = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex flex-col items-center text-center', className)}>
    {children}
  </div>
);

export const FeatureIconWrapper = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('bg-accent-magenta rounded-full p-6 w-fit', className)}>
    {children}
  </div>
);

export const FeatureHeader = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('md:max-lg:min-h-[120px] flex mt-6 mb-2', className)}>
    <div>{children}</div>
  </div>
);

export const FeatureTitle = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <p className={cn('text-gradient font-bold text-3xl xl:text-4xl', className)}>
    {children}
  </p>
);

export const FeatureBody = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('pt-4 max-w-[360px]', className)}>
    <p className="text-lg">{children}</p>
  </div>
);

export const GradientButton = ({
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => {
  const Comp = type === 'submit' ? SubmitButton : Button;
  return (
    <Comp
      className={cn(
        'bg-gradient rounded-full h-12 text-xl font-bold',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
};

export const HeroParagraph = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => (
  <p
    className={cn(
      'px-6 !leading-relaxed md:p-0 mx-auto text-xl lg:mx-0 max-lg:max-w-[480px]',
      className,
    )}
  >
    {children}
  </p>
);
