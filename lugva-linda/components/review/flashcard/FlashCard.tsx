'use client';

import type { Word } from '@prisma/client';
import { RectoCard } from './faces/RectoCard';
import { VersoCard } from './faces/VersoCard';
import { FlashcardMotion } from './FlashCardMotion';

type FlashcardProps = {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
};

export const Flashcard = ({ word, isFlipped, onFlip }: FlashcardProps) => {
  return (
    <FlashcardMotion isFlipped={isFlipped} onFlip={onFlip}>
      <RectoCard word={word.term} />
      <VersoCard word={word} />
    </FlashcardMotion>
  );
};
