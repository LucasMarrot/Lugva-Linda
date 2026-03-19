'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { toast as sonnerToast } from 'sonner';
import { SonnerToaster } from '@/components/ui/sonner';

type ToastVariant = 'error' | 'success' | 'info';

type ToastApi = {
  show: (message: string, variant?: ToastVariant) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
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

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (message) => show(message, 'error'),
      success: (message) => show(message, 'success'),
      info: (message) => show(message, 'info'),
    }),
    [show],
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

  if (!context) {
    throw new Error('useToast doit etre utilise dans un ToastProvider');
  }

  return context;
};
