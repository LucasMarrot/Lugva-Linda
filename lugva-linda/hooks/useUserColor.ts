'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { getThemeColor } from '@/lib/users/colors';

export const useUserColor = (colorHex?: string | null) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const baseColor = colorHex || undefined;

  if (!mounted) return baseColor;

  return getThemeColor(baseColor, resolvedTheme);
};
