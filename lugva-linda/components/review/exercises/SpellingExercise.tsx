'use client';

import { useState, useEffect } from 'react';
import { Rating } from 'ts-fsrs';
import { ReviewCard, ValidGrade } from '@/lib/validation/schemas';
import { CardState } from '@/hooks/useReviewSession';
import { Badge } from '@/components/ui';
import { FlashcardMotion } from '../flashcard/FlashCardMotion';
import { CardFace } from '../flashcard/faces/CardFace';
import { VersoCard } from '../flashcard/faces/VersoCard';
import { cn } from '@/lib/utils';
import {
  normalizeWord,
  getSubtleStyles,
  getGradeUI,
} from './spelling/spelling-utils';
import { SpellingHeader } from './spelling/SpellingHeader';
import { SpellingTimerBorder } from './spelling/SpellingTimerBorder';
import { SpellingForm } from './spelling/SpellingForm';
import { SpellingActions } from './spelling/SpellingActions';

type SpellingExerciseProps = {
  card: ReviewCard;
  cardState: CardState;
  onFlip: () => void;
  onRate: (grade: ValidGrade) => void;
  onNext: () => void;
  mode?: string;
};

export const SpellingExercise = ({
  card,
  cardState,
  onFlip,
  onRate,
  onNext,
  mode,
}: SpellingExerciseProps) => {
  const [inputValue, setInputValue] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [finalGrade, setFinalGrade] = useState<ValidGrade | null>(null);
  const [isFast, setIsFast] = useState(true);

  const isPractice = mode === 'PRACTICE';

  const currentTargetGrade =
    attempts.length === 0 ? (isFast ? Rating.Easy : Rating.Good) : Rating.Hard;
  const currentTargetUI = getGradeUI(currentTargetGrade);

  useEffect(() => {
    if (isPractice) return;

    let timeout: NodeJS.Timeout;
    if (!isFinished && attempts.length === 0) {
      timeout = setTimeout(() => setIsFast(false), 15000);
    }
    return () => clearTimeout(timeout);
  }, [isFinished, attempts.length, isPractice]);

  const terminateExercise = (grade: ValidGrade) => {
    setFinalGrade(grade);
    setIsFinished(true);
    onFlip();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (normalizeWord(inputValue) === normalizeWord(card.word.term)) {
      terminateExercise(currentTargetGrade);
    } else {
      const newAttempts = [...attempts, inputValue];
      setAttempts(newAttempts);
      setInputValue('');
      if (newAttempts.length >= 3) terminateExercise(Rating.Again);
    }
  };

  const handleNextAction = () => {
    if (isPractice) onNext();
    else onRate(finalGrade as ValidGrade);
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <SpellingHeader
        isFinished={isFinished}
        hasBeenRevealed={cardState.hasBeenRevealed}
        finalGrade={finalGrade}
        attempts={attempts}
        mode={mode}
      />

      <FlashcardMotion
        isFlipped={cardState.isFlipped}
        onFlip={() => {
          if (isFinished) onFlip();
        }}
      >
        <CardFace
          className={cn(
            'transition-all duration-1000',
            isFinished
              ? 'bg-primary text-primary-foreground border-primary shadow-xl'
              : isPractice
                ? 'bg-primary/5 border-primary/40'
                : getSubtleStyles(attempts.length, isFast),
          )}
        >
          {!isFinished && attempts.length === 0 && !isPractice && (
            <SpellingTimerBorder />
          )}

          {!isFinished && (
            <>
              {!isPractice && (
                <Badge
                  variant={currentTargetUI.variant}
                  className="absolute top-5 left-5 transition-colors duration-1000"
                >
                  {currentTargetUI.label}
                </Badge>
              )}
              <Badge
                variant="primaryOutline"
                className="absolute top-5 right-5"
              >
                Essai {attempts.length + 1} / 3
              </Badge>
            </>
          )}

          {isFinished ? (
            <h2 className="text-center text-4xl font-bold tracking-tight">
              {card.word.translation}
            </h2>
          ) : (
            <SpellingForm
              translation={card.word.translation}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSubmit={handleSubmit}
            />
          )}
        </CardFace>

        <VersoCard word={card.word} mainText={card.word.term} />
      </FlashcardMotion>

      <SpellingActions
        isFinished={isFinished}
        hasBeenRevealed={cardState.hasBeenRevealed}
        isSubmitting={cardState.isSubmitting}
        onGiveUp={() => terminateExercise(Rating.Again)}
        onNextAction={handleNextAction}
        mode={mode}
      />
    </div>
  );
};
