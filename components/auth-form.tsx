import Form from 'next/form';

import { FloatingLabelInput } from './ui/floating-input';
import { useState } from 'react';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  hidePassword = false,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  hidePassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-8">
        <FloatingLabelInput
          id="email"
          name="email"
          label="Email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />

        {!hidePassword && (
          <div className="relative">
            <FloatingLabelInput
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              label="Password"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOpenIcon className="size-5" />
              ) : (
                <EyeClosedIcon className="size-5" />
              )}
            </button>
          </div>
        )}
      </div>
      {children}
    </Form>
  );
}
