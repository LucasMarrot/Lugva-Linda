import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        secondaryOutline:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-border',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeProps = Omit<React.ComponentProps<'span'>, 'onDelete'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    onDelete?: () => void;
    deleteLabel?: string;
  };

function Badge({
  className,
  variant = 'default',
  asChild = false,
  onDelete,
  deleteLabel = 'Supprimer',
  onClick,
  onKeyDown,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild && !onDelete ? Slot.Root : 'span';
  const isClickable = typeof onClick === 'function';

  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (
    event,
  ) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !isClickable) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-clickable={isClickable ? 'true' : 'false'}
      className={cn(
        badgeVariants({ variant }),
        onDelete && 'pr-1',
        isClickable && 'cursor-pointer select-none',
        className,
      )}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : onKeyDown}
      role={isClickable ? 'button' : props.role}
      tabIndex={isClickable ? 0 : props.tabIndex}
      {...props}
    >
      <span className="truncate">{children}</span>

      {onDelete ? (
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
          className="hover:bg-foreground/10 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </Comp>
  );
}

export { Badge, badgeVariants };
