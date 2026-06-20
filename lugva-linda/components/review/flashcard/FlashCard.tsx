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

  const displayTerms = [word.term, ...(word.synonyms || [])]
    .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    .join(' / ');

  const rectoText = isReverse ? word.translation : displayTerms;
  const versoText = isReverse ? displayTerms : word.translation;

  return (
    <FlashcardMotion isFlipped={isFlipped} onFlip={onFlip}>
      <RectoCard text={rectoText} mandatoryTag={word.mandatoryTag} />
      <VersoCard word={word} mainText={versoText} />
    </FlashcardMotion>
  );
};
