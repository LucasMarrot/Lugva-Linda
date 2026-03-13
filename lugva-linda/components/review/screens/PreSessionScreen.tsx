'use client';

import { Button } from '@/components/ui/button';
import { Play, Clock, Brain } from 'lucide-react';

interface PreSessionScreenProps {
  wordCount: number;
  onStart: () => void;
}

export const PreSessionScreen = ({
  wordCount,
  onStart,
}: PreSessionScreenProps) => {
  // TODO : Intégrer un vrai calcul en fonction du temps des sessions précédentes, du nombre de mots, etc.
  // Calcul de l'estimation (30 secondes par mot)
  const estimatedSeconds = wordCount * 30;
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;

  const timeString =
    minutes > 0
      ? `${minutes} min ${seconds > 0 ? `${seconds} s` : ''}`
      : `${seconds} s`;

  return (
    <div className="animate-in fade-in zoom-in mx-auto flex h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center p-4 text-center duration-500">
      <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Brain className="text-primary h-10 w-10" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">Prêt pour la révision ?</h1>
      <p className="text-muted-foreground mb-8">
        Votre cerveau est sur le point de consolider de nouvelles connexions.
      </p>

      <div className="mb-8 grid w-full grid-cols-2 gap-4">
        <div className="bg-card border-border flex flex-col items-center rounded-xl border p-4 shadow-sm">
          <span className="text-primary mb-1 text-3xl font-bold">
            {wordCount}
          </span>
          <span className="text-muted-foreground text-sm">Mots à réviser</span>
        </div>

        <div className="bg-card border-border flex flex-col items-center rounded-xl border p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="text-primary h-5 w-5" />
            <span className="text-primary text-xl font-bold">{timeString}</span>
          </div>
          <span className="text-muted-foreground text-sm">Temps estimé</span>
        </div>
      </div>

      <Button
        size="lg"
        className="h-14 w-full gap-2 rounded-xl text-lg"
        onClick={onStart}
      >
        <Play className="h-5 w-5 fill-current" />
        Commencer la session
      </Button>
    </div>
  );
};
