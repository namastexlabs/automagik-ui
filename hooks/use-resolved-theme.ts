/**
 * Get resolved theme from next-themes SSR friendly hook
 */
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const useResolvedTheme = () => {
  const { resolvedTheme } = useTheme();
  const [colorMode, setColorMode] = useState<string>();

  useEffect(() => {
    setColorMode(resolvedTheme);
  }, [resolvedTheme]);

  return colorMode;
};