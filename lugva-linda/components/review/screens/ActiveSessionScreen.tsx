'use client';

import type { Word } from '@prisma/client';

import { useReviewSession, type SessionStats } from '@/hooks/useReviewSession';
import { DynamicProgressBar } from '../controls/DynamicProgressBar';
import { RatingButtonGroup } from '../controls/RatingButtonGroup';
import { SessionLayoutMotion } from '../controls/SessionLayoutMotion';
import { RatingRevealMotion } from '../controls/RatingRevealMotion';
import { LapseTransitionScreen } from './LapseTransitionScreen';
import { Flashcard } from '../flashcard/FlashCard';
import { SessionHeader } from '../SessionHeader';

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
    return (
      <LapseTransitionScreen
        onContinue={actions.dismissTransition}
        onQuit={onQuit}
        languageName={languageName}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden p-4">
      <SessionHeader languageName={languageName} onQuit={onQuit} />
      <div className="mb-2 flex shrink-0 flex-col gap-3 py-4">
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
