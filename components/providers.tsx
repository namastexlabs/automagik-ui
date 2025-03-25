'use client';

import type { PropsWithChildren } from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ProgressProvider } from '@bprogress/next/app';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={0}>
        <ProgressProvider
          height="4px"
          color="#00FFFF"
          options={{ showSpinner: false }}
          shallowRouting
        >
          {children}
        </ProgressProvider>
      </TooltipProvider>
    </NextThemesProvider>
  );
}
