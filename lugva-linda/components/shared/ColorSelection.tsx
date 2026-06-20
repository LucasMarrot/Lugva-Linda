'use client';

import { getThemeColor, USER_COLOR_OPTIONS } from '@/lib/users/colors';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ColorSelectionProps = {
  value: string;
  onChange: (color: string) => void;
  initialColor?: string;
  unavailableColors?: string[];
};

export const ColorSelection = ({
  value,
  onChange,
  initialColor,
  unavailableColors = [],
}: ColorSelectionProps) => {
  const { resolvedTheme } = useTheme(); //
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const visibleColors = USER_COLOR_OPTIONS.filter((color) => {
    const isInitial = initialColor ? color === initialColor : false;
    return isInitial || !unavailableColors.includes(color);
  });

  const currentTheme = mounted ? resolvedTheme : 'light';
  const displayPreviewColor = getThemeColor(value, currentTheme);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="border-border h-12 w-12 shrink-0 rounded-lg border"
          style={{ backgroundColor: displayPreviewColor }}
        />
        <div>
          <p className="text-sm font-semibold">
            {initialColor && value === initialColor
              ? 'Couleur actuelle'
              : 'Couleur sélectionnée'}
          </p>
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {value}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {visibleColors.map((baseColor) => {
          const isActive = baseColor === value;
          const isInitial = initialColor ? baseColor === initialColor : false;
          const displayPastilleColor = getThemeColor(baseColor, currentTheme);

          return (
            <button
              key={baseColor}
              type="button"
              aria-pressed={isActive}
              aria-label={`Choisir la couleur ${baseColor}`}
              className={cn(
                'h-10 w-10 rounded-full border transition-all duration-300 active:scale-95',
                isActive
                  ? 'border-foreground ring-foreground/40 scale-110 ring-2'
                  : 'border-border hover:border-foreground/50 cursor-pointer',
                isInitial && !isActive && 'ring-foreground/20 ring-2',
              )}
              style={{ backgroundColor: displayPastilleColor }}
              onClick={() => onChange(baseColor)}
            />
          );
        })}
      </div>
    </div>
  );
};
