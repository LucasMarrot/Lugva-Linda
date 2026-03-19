'use client';

import { Button } from '@/components/ui/button';
import { Play, Clock, Brain } from 'lucide-react';
import type { ReviewSessionIntent } from '../ReviewSessionContainer';
import { cn } from '@/lib/utils';
import { SessionHeader } from '../SessionHeader';

type PreSessionScreenProps = {
  wordCount: number;
  sessionIntent: ReviewSessionIntent;
  onStart: () => void;
  onQuit: () => void;
  languageName?: string;
};

export const PreSessionScreen = ({
  wordCount,
  sessionIntent,
  onStart,
  onQuit,
  languageName = 'Anglais',
}: PreSessionScreenProps) => {
  const isForcedFill = sessionIntent.mode === 'FORCED_FILL';

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
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col p-4 text-center">
      <SessionHeader languageName={languageName} onQuit={onQuit} />

      <div className="animate-in fade-in zoom-in mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center duration-500">
        <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Brain className="text-primary h-10 w-10" />
        </div>

        <h1 className="mb-2 text-3xl font-bold">Prêt pour la révision ?</h1>
        <p
          className={cn(
            'mb-8',
            isForcedFill
              ? 'text-destructive font-medium'
              : 'text-muted-foreground',
          )}
        >
          {isForcedFill
            ? `Session forcée à ${sessionIntent.targetCount} mots : ce remplissage anticipé n'est pas optimisé pour l'apprentissage.`
            : 'Votre cerveau est sur le point de consolider de nouvelles connexions.'}
        </p>

        <div className="mb-8 grid w-full grid-cols-2 gap-4">
          <div className="bg-card border-border flex flex-col items-center rounded-xl border p-4 shadow-sm">
            <span className="text-primary mb-1 text-3xl font-bold">
              {wordCount}
            </span>
            <span className="text-muted-foreground text-sm">
              Mots à réviser
            </span>
          </div>

          <div className="bg-card border-border flex flex-col items-center rounded-xl border p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              <span className="text-primary text-xl font-bold">
                {timeString}
              </span>
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
    </div>
  );
};
