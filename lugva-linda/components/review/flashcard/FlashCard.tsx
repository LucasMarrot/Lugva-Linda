'use client';

import type { Word } from '@prisma/client';
import { RectoCard } from './faces/RectoCard';
import { VersoCard } from './faces/VersoCard';
import { FlashcardMotion } from './FlashCardMotion';

type FlashcardProps = {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  mode?: 'RECOGNITION' | 'REVERSE';
};

export const Flashcard = ({
  word,
  isFlipped,
  onFlip,
  mode = 'RECOGNITION',
}: FlashcardProps) => {
  const isReverse = mode === 'REVERSE';
  const rectoText = isReverse ? word.translation : word.term;
  const versoText = isReverse ? word.term : word.translation;

  return (
    <FlashcardMotion isFlipped={isFlipped} onFlip={onFlip}>
      <RectoCard text={rectoText} mandatoryTag={word.mandatoryTag} />
      <VersoCard word={word} mainText={versoText} />
    </FlashcardMotion>
  );
};
