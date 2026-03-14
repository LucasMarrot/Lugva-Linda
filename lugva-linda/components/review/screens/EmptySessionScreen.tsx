'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

type EmptySessionScreenProps = {
  onQuit: () => void;
  languageName?: string;
};

export const EmptySessionScreen = ({ onQuit }: EmptySessionScreenProps) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col pt-2 pb-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Aucun mot à réviser</h2>
        <p className="text-muted-foreground mb-6">
          Vous êtes à jour ! Revenez plus tard ou ajoutez de nouveaux mots.
        </p>
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
