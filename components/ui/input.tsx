import * as React from 'react';

import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-accent px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: '',
        floating: 'flex h-auto w-full rounded-full border-2 bg-background px-6 py-2 text-foreground placeholder:text-muted-foreground shadow-sm ring-offset-muted-foreground ring-offset-1 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  },
);
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { variant?: 'default' | 'floating' }
>(({ className, type, variant = 'default', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
