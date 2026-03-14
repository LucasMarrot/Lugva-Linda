'use client';

import { X } from 'lucide-react';

import { ConfirmButton } from '@/components/shared/ConfirmButton';

type SessionHeaderProps = {
  languageName: string;
  onQuit?: () => void;
};

export const SessionHeader = ({ languageName, onQuit }: SessionHeaderProps) => {
  return (
    <header className="flex h-10 w-full items-center justify-between px-4 pt-2">
      <h1 className="text-xl font-bold">{languageName}</h1>
      {onQuit && (
        <ConfirmButton
          onConfirm={onQuit}
          idleText="Quitter"
          idleIcon={<X className="h-4 w-4" />}
          idleVariant="ghostDestructive"
          confirmVariant="destructive"
        />
      )}
    </header>
  );
};
