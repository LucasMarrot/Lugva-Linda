'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { StateMessage } from '@/components/shared/StateMessage';

type EmptySessionScreenProps = {
  onQuit: () => void;
  languageName?: string;
};

export const EmptySessionScreen = ({ onQuit }: EmptySessionScreenProps) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col pt-2 pb-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-6 w-full max-w-md">
          <StateMessage
            tone="success"
            title="Aucun mot a reviser"
            message="Vous etes a jour. Revenez plus tard ou ajoutez de nouveaux mots."
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-full gap-2 rounded-xl"
          onClick={onQuit}
        >
          <Home className="h-5 w-5" />
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
};
