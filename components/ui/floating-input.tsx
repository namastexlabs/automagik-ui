'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const FloatingInput = React.forwardRef<
  HTMLInputElement,
  InputProps & { isFocused: boolean }
>(({ className, isFocused, ...props }, ref) => {
  return (
    <Input
      placeholder=" "
      variant="floating"
      className={cn(
        'peer !bg-accent',
        '!ring-0 !ring-offset-0 border-2 border-muted-foreground p-4',
        {
          '!border-accent-cyan': isFocused,
        },
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
FloatingInput.displayName = 'FloatingInput';

const FloatingLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label> & {
    isFocused: boolean;
  }
>(({ className, isFocused, ...props }, ref) => {
  return (
    <Label
      className={cn(
        'absolute top-0 ml-2 translate-y-[-0.8em] scale-75 start-[1.65rem] cursor-text z-20 origin-[0] transform text-md text-muted-foreground duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100',
        {
          'text-accent-foreground': isFocused,
        },
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
FloatingLabel.displayName = 'FloatingLabel';

type FloatingLabelInputProps = InputProps & { label: string };

export const FloatingLabelInput = React.forwardRef<
  React.ElementRef<typeof FloatingInput>,
  React.PropsWithoutRef<FloatingLabelInputProps>
>(({ id, label, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const labelRef = React.useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = React.useState(0);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.clientWidth * 0.75);
    }
  }, [isFocused, label]);

  React.useEffect(() => {
    const labelElement = labelRef.current;
    if (labelElement) {
      const updateLabelMeasurements = () => {
        if (labelElement) {
          setLabelWidth(labelElement.clientWidth * 0.75);
        }
      };

      updateLabelMeasurements();

      const resizeObserver = new ResizeObserver(updateLabelMeasurements);
      resizeObserver.observe(labelElement);

      return () => {
        if (labelElement) {
          resizeObserver.unobserve(labelElement);
        }
      };
    }
  }, []);

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
    },
    [],
  );

  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: Does not interfere with keyboard navigation
    // biome-ignore lint/a11y/useKeyWithClickEvents: Does not interfere with keyboard navigation
    <div
      className="relative cursor-text"
      tabIndex={-1}
      aria-hidden="true"
      onClick={() => inputRef.current?.focus()}
    >
      <FloatingInput
        ref={(el) => {
          inputRef.current = el;
          if (ref) {
            if (typeof ref === 'function') {
              ref(el);
            } else {
              ref.current = el;
            }
          }
        }}
        id={id}
        onFocus={handleFocus}
        onBlur={handleBlur}
        isFocused={isFocused}
        {...props}
      />
      <FloatingLabel
        ref={labelRef}
        htmlFor={id}
        isFocused={isFocused}
        className={cn('font-normal text-muted-foreground', {
          'text-accent-foreground': isFocused,
        })}
      >
        {label}
      </FloatingLabel>
      <div
        className={cn(
          'absolute block peer-placeholder-shown:opacity-0 transition-opacity duration-300 top-[0px] z-10 h-[5px] ml-7 bg-black pointer-events-none',
        )}
        style={{ width: `calc(${labelWidth}px + 0.9rem)` }}
        aria-hidden="true"
      />
    </div>
  );
});
FloatingLabelInput.displayName = 'FloatingLabelInput';
