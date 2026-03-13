'use client';

import type { Word } from '@prisma/client';
import { X } from 'lucide-react';

import { useReviewSession, type SessionStats } from '@/hooks/useReviewSession';
import { DynamicProgressBar } from '../controls/DynamicProgressBar';
import { RatingButtonGroup } from '../controls/RatingButtonGroup';
import { ConfirmButton } from '@/components/shared/ConfirmButton';
import { SessionLayoutMotion } from '../controls/SessionLayoutMotion';
import { RatingRevealMotion } from '../controls/RatingRevealMotion';
import { LapseTransitionScreen } from './LapseTransitionScreen';
import { Flashcard } from '../flashcard/FlashCard';

type ActiveSessionScreenProps = {
  initialWords: Word[];
  onComplete: (stats: SessionStats) => void;
  onQuit: () => void;
  languageName?: string;
};

export const ActiveSessionScreen = ({
  initialWords,
  onComplete,
  onQuit,
  languageName = 'Anglais',
}: ActiveSessionScreenProps) => {
  const { currentWord, progress, cardState, showLapseTransition, actions } =
    useReviewSession(initialWords, onComplete);

  if (!currentWord) return null;

  if (showLapseTransition) {
    return <LapseTransitionScreen onContinue={actions.dismissTransition} />;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden pt-2 pb-4">
      <div className="mb-2 flex shrink-0 flex-col gap-3 px-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-xl font-bold">{languageName}</h1>
          <ConfirmButton
            onConfirm={onQuit}
            idleText="Quitter"
            idleIcon={<X className="h-4 w-4" />}
            idleVariant="ghostDestructive"
            confirmVariant="destructive"
            className="h-8 px-2"
          />
        </div>

        <DynamicProgressBar
          initialCount={progress.initialCount}
          currentIndex={progress.currentIndex}
          lapsesCount={progress.lapsesCount}
        />

        <div className="mt-1 text-center">
          <span className="text-muted-foreground bg-secondary/50 rounded-full px-3 py-1 text-xs font-medium">
            Trouve la traduction de ce mot
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-4">
        <SessionLayoutMotion>
          <Flashcard
            word={currentWord}
            isFlipped={cardState.isFlipped}
            onFlip={actions.handleFlip}
          />
          <RatingRevealMotion isVisible={cardState.hasBeenRevealed}>
            <RatingButtonGroup
              onRate={actions.handleRate}
              disabled={cardState.isSubmitting}
            />
          </RatingRevealMotion>
        </SessionLayoutMotion>
      </div>
    </div>
  );
};
