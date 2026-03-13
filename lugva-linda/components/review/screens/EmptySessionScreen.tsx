'use client';

import { Button } from '@/components/ui/button';

type EmptySessionScreenProps = {
  onGoHome: () => void;
};

export const EmptySessionScreen = ({ onGoHome }: EmptySessionScreenProps) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-2 text-2xl font-bold">Aucun mot à réviser</h2>
      <p className="text-muted-foreground mb-6">
        Vous êtes à jour ! Revenez plus tard ou ajoutez de nouveaux mots.
      </p>
      <Button
        variant="link"
        onClick={onGoHome}
        className="text-primary text-lg"
      >
        Retour à l'accueil
      </Button>
    </div>
  );
};
