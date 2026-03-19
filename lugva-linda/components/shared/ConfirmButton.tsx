'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  onConfirm: () => void;
  idleText: string;
  confirmText?: string;
  idleIcon?: ReactNode;
  confirmIcon?: ReactNode;
  idleVariant?: ButtonProps['variant'];
  confirmVariant?: ButtonProps['variant'];
  timeoutMs?: number;
  isConfirming?: boolean;
  onConfirmingChange?: (isConfirming: boolean) => void;
}

export const ConfirmButton = ({
  onConfirm,
  idleText,
  confirmText = 'Confirmer',
  idleIcon,
  confirmIcon = <AlertCircle className="h-4 w-4" />,
  idleVariant = 'secondary',
  confirmVariant = 'destructive',
  timeoutMs = 3000,
  isConfirming: controlledIsConfirming,
  onConfirmingChange,
  className,
  ...props
}: ConfirmButtonProps) => {
  const [internalIsConfirming, setInternalIsConfirming] = useState(false);

  const isConfirming =
    controlledIsConfirming !== undefined
      ? controlledIsConfirming
      : internalIsConfirming;

  const handleSetConfirming = (val: boolean) => {
    if (onConfirmingChange) onConfirmingChange(val);
    else setInternalIsConfirming(val);
  };

  useEffect(() => {
    if (!isConfirming) return;

    const timer = setTimeout(() => {
      if (onConfirmingChange) {
        onConfirmingChange(false);
        return;
      }

      setInternalIsConfirming(false);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [isConfirming, timeoutMs, onConfirmingChange]);

  if (isConfirming) {
    return (
      <Button
        variant={confirmVariant}
        onClick={(e) => {
          e.stopPropagation();
          handleSetConfirming(false);
          onConfirm();
        }}
        className={cn('animate-in slide-in-from-right-2 gap-2', className)}
        {...props}
      >
        {confirmIcon}
        {confirmText}
      </Button>
    );
  }

  return (
    <Button
      variant={idleVariant}
      onClick={(e) => {
        e.stopPropagation();
        handleSetConfirming(true);
      }}
      className={cn('gap-2', className)}
      {...props}
    >
      {idleIcon}
      {idleText}
    </Button>
  );
};
