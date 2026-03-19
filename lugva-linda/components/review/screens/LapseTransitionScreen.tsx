'use client';

import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { SessionHeader } from '../SessionHeader';

type LapseTransitionScreenProps = {
  onContinue: () => void;
  onQuit: () => void;
  languageName?: string;
};

export const LapseTransitionScreen = ({
  onContinue,
  onQuit,
  languageName = 'Anglais',
}: LapseTransitionScreenProps) => {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col p-4 text-center">
      <SessionHeader languageName={languageName} onQuit={onQuit} />

      <div className="animate-in fade-in zoom-in flex flex-1 flex-col items-center justify-center duration-500">
        <div className="bg-destructive/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <RefreshCcw className="text-destructive h-10 w-10" />
        </div>
        <h2 className="mb-4 text-3xl font-bold">Phase de renforcement</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Vous avez terminé les nouveaux mots. Nous allons maintenant revoir
          ensemble ceux qui vous ont posé problème.
        </p>
        <Button
          onClick={onContinue}
          size="lg"
          className="h-14 w-full max-w-sm rounded-xl text-lg"
        >
          Continuer la révision
        </Button>
      </div>
    </div>
  );
};
