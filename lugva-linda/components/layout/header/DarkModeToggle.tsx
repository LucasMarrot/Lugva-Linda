'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui';

export const DarkModeToggle = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!isMounted) return null;

  const isDark = resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleDarkMode}
      className="absolute top-2 right-2 z-50 rounded-full border transition-transform active:scale-95"
      aria-label="Changer de thème"
    >
      {isDark ? (
        <Sun className="animate-in spin-in-12 h-5 w-5 text-yellow-500 duration-300" />
      ) : (
        <Moon className="animate-in h-5 w-5 text-slate-700 duration-300 dark:text-slate-200" />
      )}
    </Button>
  );
};
