'use client';

import { ReviewCard, ValidGrade } from '@/lib/validation/schemas';
import { CardState } from '@/hooks/useReviewSession';
import { Flashcard } from '../flashcard/FlashCard';
import { RatingRevealMotion } from '../controls/RatingRevealMotion';
import { RatingButtonGroup } from '../controls/RatingButtonGroup';
import { NextButton } from '../controls/NextButton';

type RecognitionExerciseProps = {
  card: ReviewCard;
  cardState: CardState;
  onFlip: () => void;
  onRate: (grade: ValidGrade) => void;
  onNext: () => void;
  mode?: string;
};

export const RecognitionExercise = ({
  card,
  cardState,
  onFlip,
  onRate,
  onNext,
  mode,
}: RecognitionExerciseProps) => {
  const isReverse = card.type === 'REVERSE';
  return (
    <>
      <Flashcard
        word={card.word}
        isFlipped={cardState.isFlipped}
        onFlip={onFlip}
        mode={isReverse ? 'REVERSE' : 'RECOGNITION'}
      />
      <RatingRevealMotion isVisible={cardState.hasBeenRevealed}>
        {mode === 'PRACTICE' ? (
          <NextButton onClick={onNext} />
        ) : (
          <RatingButtonGroup
            onRate={onRate}
            disabled={cardState.isSubmitting}
          />
        )}
      </RatingRevealMotion>
    </>
  );
};
