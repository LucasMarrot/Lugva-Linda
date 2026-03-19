import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNavAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        'ui-motion-interactive ui-tap-feedback flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full shadow-lg ring-4',
        'bg-primary text-primary-foreground ring-background',
        className,
      )}
      aria-label="Rechercher ou ajouter un mot"
    >
      <Search className="h-6 w-6" />
    </button>
  );
});

BottomNavAction.displayName = 'BottomNavAction';
