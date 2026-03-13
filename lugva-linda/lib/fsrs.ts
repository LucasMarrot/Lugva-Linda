import { fsrs, Card, State, Rating, createEmptyCard } from 'ts-fsrs';
import type { Word } from '@prisma/client';

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

export const mapWordToCard = (word: Word): Card => {
  const defaultCard = createEmptyCard();

  return {
    ...defaultCard,
    due: word.due,
    stability: word.stability,
    difficulty: word.difficulty,
    scheduled_days: word.scheduledDays,
    reps: word.reps,
    lapses: word.lapses,
    state: word.state as State,
    last_review: word.lastReview ?? undefined,
  };
};

export interface FSRSUpdateData {
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: Date | null;
}

export const mapCardToWordUpdate = (card: Card): FSRSUpdateData => {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    lastReview: card.last_review ? card.last_review : null,
  };
};
