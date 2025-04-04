'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    thumbClassName?: string;
    renderThumbContent?: () => React.ReactNode;
  }
>(({ className, thumbClassName, renderThumbContent, ...props }, ref) => {
  const rootRef = React.useRef<HTMLButtonElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = React.useState(0);

  React.useEffect(() => {
    if (rootRef.current && thumbRef.current) {
      const root = rootRef.current;
      const thumb = thumbRef.current;
      const rootObserver = new ResizeObserver(() => {
        const width = root.offsetWidth;
        const thumbWidth = thumb.offsetWidth + 7;
        setTranslateX(width - thumbWidth);
      });

      const thumbObserver = new ResizeObserver(() => {
        const width = root.offsetWidth;
        const thumbWidth = thumb.offsetWidth;
        setTranslateX(width - thumbWidth);
      });

      rootObserver.observe(root);
      thumbObserver.observe(thumb);

      return () => {
        rootObserver.disconnect();
        thumbObserver.disconnect();
      };
    }
  }, []);

  return (
    <SwitchPrimitives.Root
      ref={rootRef}
      className={cn(
        'peer inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 bg-accent border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        ref={thumbRef}
        className={cn(
          'group/thumb pointer-events-none h-3 w-3 rounded-full bg-light-gray data-[state=checked]:bg-accent-foreground shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[calc(var(--translate-x)_-_0.45rem)] data-[state=unchecked]:translate-x-1',
          thumbClassName,
        )}
        style={{ '--translate-x': `${translateX}px` } as React.CSSProperties}
      >
        {renderThumbContent?.()}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
