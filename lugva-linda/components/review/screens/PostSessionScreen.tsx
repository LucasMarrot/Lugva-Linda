'use client';

import { Button } from '@/components/ui/button';
import { SessionStats } from '@/hooks/useReviewSession';
import { Trophy, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostSessionScreenProps {
  stats: SessionStats;
}

export const PostSessionScreen = ({ stats }: PostSessionScreenProps) => {
  const router = useRouter();
  const totalWords = stats.easy + stats.good + stats.hard;

  return (
    <div className="animate-in fade-in zoom-in mx-auto flex h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center overflow-hidden p-4 text-center duration-500">
      <div className="mb-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
        <Trophy className="h-10 w-10 text-yellow-500" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">Session terminée !</h1>
      <p className="text-muted-foreground mb-8">
        Vous avez validé{' '}
        <span className="text-foreground font-bold">
          {totalWords} mots uniques
        </span>
        . Voici votre niveau de rétention final :
      </p>

      <div className="mb-8 grid w-full grid-cols-3 gap-3">
        <div className="bg-card flex flex-col items-center rounded-xl border border-blue-500/30 p-3 shadow-sm">
          <span className="mb-1 text-3xl font-bold text-blue-500">
            {stats.easy}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Faciles
          </span>
        </div>

        <div className="bg-card border-primary/30 flex flex-col items-center rounded-xl border p-3 shadow-sm">
          <span className="text-primary mb-1 text-3xl font-bold">
            {stats.good}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Bons
          </span>
        </div>

        <div className="bg-card flex flex-col items-center rounded-xl border border-orange-500/30 p-3 shadow-sm">
          <span className="mb-1 text-3xl font-bold text-orange-500">
            {stats.hard}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Difficiles
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="h-14 w-full gap-2 rounded-xl"
        onClick={() => router.push('/')}
      >
        <Home className="h-5 w-5" />
        Retour à l'accueil
      </Button>
    </div>
  );
};
