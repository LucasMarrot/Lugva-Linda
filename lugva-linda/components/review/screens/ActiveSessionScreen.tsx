'use client';

import { useReviewSession, type SessionStats } from '@/hooks/useReviewSession';
import { DynamicProgressBar } from '../controls/DynamicProgressBar';
import { SessionLayoutMotion } from '../controls/SessionLayoutMotion';
import { LapseTransitionScreen } from './LapseTransitionScreen';
import { SessionHeader } from '../SessionHeader';
import { Badge } from '@/components/ui';
import {
  ExerciseDispatcher,
  getExerciseConfig,
} from '../exercises/ExerciseDispatcher';
import { ReviewCard } from '@/lib/validation/schemas';

type ActiveSessionScreenProps = {
  initialCards: ReviewCard[];
  mode?: string;
  onComplete: (stats: SessionStats) => void;
  onQuit: () => void;
  languageName?: string;
  isSimulationMode?: boolean;
};

export const ActiveSessionScreen = ({
  initialCards,
  mode = 'DUE_ONLY',
  onComplete,
  onQuit,
  languageName = 'ERREUR',
  isSimulationMode = false,
}: ActiveSessionScreenProps) => {
  const { currentCard, progress, cardState, showLapseTransition, actions } =
    useReviewSession(initialCards, onComplete, isSimulationMode);

  if (!currentCard) return null;

  if (showLapseTransition) {
    return (
      <LapseTransitionScreen
        onContinue={actions.dismissTransition}
        onQuit={onQuit}
        languageName={languageName}
      />
    );
  }

  const { label, instruction, icon } = getExerciseConfig(currentCard.type);

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden p-4">
      <SessionHeader languageName={languageName} onQuit={onQuit} />
      <div className="mb-2 flex shrink-0 flex-col gap-3 py-4">
        <DynamicProgressBar
          initialCount={progress.initialCount}
          currentIndex={progress.currentIndex}
          lapsesCount={progress.lapsesCount}
        />
        <div className="flex flex-col items-center justify-center gap-2 px-4">
          <div className="bg-background flex flex-row items-center justify-between gap-3 p-2">
            <div className="text-primary-foreground bg-primary flex items-center justify-center rounded p-2">
              {icon}
            </div>
            <span className="text-primary text-xs font-bold tracking-wider uppercase">
              {label}
            </span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {instruction}
          </Badge>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-4">
        <SessionLayoutMotion>
          <ExerciseDispatcher
            key={currentCard.id}
            card={currentCard}
            cardState={cardState}
            actions={actions}
            mode={mode}
          />
        </SessionLayoutMotion>
      </div>
    </div>
  );
};
