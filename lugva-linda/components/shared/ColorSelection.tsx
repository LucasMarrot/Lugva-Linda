'use client';

import { USER_COLOR_OPTIONS } from '@/lib/users/colors';
import { cn } from '@/lib/utils';

type ColorSelectionProps = {
  value: string;
  onChange: (color: string) => void;
  initialColor?: string;
};

export const ColorSelection = ({
  value,
  onChange,
  initialColor,
}: ColorSelectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="border-border h-12 w-12 shrink-0 rounded-lg border"
          style={{ backgroundColor: value }}
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
        {USER_COLOR_OPTIONS.map((color) => {
          const isActive = color === value;
          const isInitial = initialColor ? color === initialColor : false;

          return (
            <button
              key={color}
              type="button"
              aria-pressed={isActive}
              aria-label={`Choisir la couleur ${color}`}
              className={cn(
                'h-10 w-10 rounded-full border transition-all active:scale-95',
                isActive
                  ? 'border-foreground ring-foreground/40 ring-2'
                  : 'border-border hover:border-foreground/50 cursor-pointer',
                isInitial && !isActive && 'ring-foreground/20 ring-2',
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          );
        })}
      </div>
    </div>
  );
};
