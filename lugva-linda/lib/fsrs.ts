import {
  fsrs,
  Card as FsrsCard,
  State,
  Rating,
  createEmptyCard,
} from 'ts-fsrs';
import type { Card as DbCard } from '@prisma/client';
import { ValidationError } from '@/lib/errors';

const RETENTION_RATE = 0.9; // Standard optimal pour une mémorisation efficace

export const fsrsEngine = fsrs({
  request_retention: RETENTION_RATE,
});

export const FSRSRating = {
  Again: Rating.Again, // 1 : Oubli
  Hard: Rating.Hard, // 2 : Difficile
  Good: Rating.Good, // 3 : Bon
  Easy: Rating.Easy, // 4 : Facile
} as const;

const assertFiniteNumber = (value: number, fieldName: string) => {
  if (!Number.isFinite(value)) {
    throw new ValidationError(
      `Valeur FSRS invalide pour ${fieldName}.`,
      'INVALID_FSRS_OUTPUT',
    );
  }
};

export const mapDbCardToFsrsCard = (card: DbCard): FsrsCard => {
  const defaultCard = createEmptyCard();

  return {
    ...defaultCard,
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview ?? undefined,
  };
};

export const validateFsrsCard = (card: FsrsCard): FsrsCard => {
  assertFiniteNumber(card.stability, 'stability');
  assertFiniteNumber(card.difficulty, 'difficulty');
  assertFiniteNumber(card.scheduled_days, 'scheduled_days');
  assertFiniteNumber(card.reps, 'reps');
  assertFiniteNumber(card.lapses, 'lapses');
  assertFiniteNumber(Number(card.state), 'state');

  return card;
};
