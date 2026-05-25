'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { toast as sonnerToast } from 'sonner';
import { SonnerToaster } from '@/components/ui';

type ToastVariant = 'error' | 'success' | 'info';

type ToastApi = {
  show: (message: string, variant?: ToastVariant) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  challenge: (
    message: ReactNode,
    onAccept: () => void,
    onDecline: () => void,
  ) => void;
};

const ToastContext = createContext<ToastApi | undefined>(undefined);

const TOAST_DURATION_MS = 3600;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const uniqueToastId = `${Date.now()}-${Math.random()}`;

      if (variant === 'error') {
        sonnerToast.error(message, {
          id: uniqueToastId,
          duration: TOAST_DURATION_MS,
        });
        return;
      }

      if (variant === 'success') {
        sonnerToast.success(message, {
          id: uniqueToastId,
          duration: TOAST_DURATION_MS,
        });
        return;
      }

      sonnerToast.info(message, {
        id: uniqueToastId,
        duration: TOAST_DURATION_MS,
      });
    },
    [],
  );

  const challenge = useCallback(
    (message: ReactNode, onAccept: () => void, onDecline: () => void) => {
      sonnerToast(message, {
        duration: 10000,
        action: {
          label: 'Accepter',
          onClick: onAccept,
        },
        cancel: {
          label: 'Refuser',
          onClick: onDecline,
        },
        className: '!bg-primary-soft !text-primary !border-primary !shadow-2xl',
      });
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (message) => show(message, 'error'),
      success: (message) => show(message, 'success'),
      info: (message) => show(message, 'info'),
      challenge,
    }),
    [show, challenge],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <SonnerToaster />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error('useToast doit etre utilise dans un ToastProvider');
  return context;
};
