'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const SonnerToaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      theme="system"
      richColors
      closeButton
      style={{ zIndex: 2147483647 }}
      {...props}
    />
  );
};

export { SonnerToaster };
