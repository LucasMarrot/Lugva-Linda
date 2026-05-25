'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const SonnerToaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      theme="light"
      richColors
      closeButton
      style={{ zIndex: 2147483647 }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:!h-fit',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground group-[.toast]:!ms-2 group-[.toast]:!font-semibold group-[.toast]:hover:!bg-primary/80 group-[.toast]:!transition-colors',
          cancelButton:
            'group-[.toast]:!bg-secondary group-[.toast]:!text-foreground group-[.toast]:!border-foreground group-[.toast]:hover:!bg-secondary/80 group-[.toast]:!transition-colors',
          closeButton:
            '!absolute !-top-1.5 !-right-1.5 !left-auto !bg-secondary !border-muted-foreground !text-muted-foreground hover:!text-foreground !transform-none',

          success:
            '!bg-emerald-50 dark:!bg-emerald-100 !text-emerald-700 dark:!text-emerald-300 !border-emerald-200',

          error:
            '!bg-destructive-50 dark:!bg-destructive-100 !text-destructive-700 dark:!text-destructive-300 !border-destructive-200',

          warning:
            '!bg-orange-50 dark:!bg-orange-100 !text-orange-600 dark:!text-orange-400 !border-orange-200',

          info: '!bg-blue-50 dark:!bg-blue-100 !text-blue-500 dark:!text-blue-300 !border-blue-200',
        },
      }}
      {...props}
    />
  );
};

export { SonnerToaster };
