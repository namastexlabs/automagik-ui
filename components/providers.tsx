'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ProgressProvider } from '@bprogress/next/app';
import type { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ProgressProvider
        height="4px"
        color="#00FFFF"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
      </ProgressProvider>
    </NextThemesProvider>
  );
}
