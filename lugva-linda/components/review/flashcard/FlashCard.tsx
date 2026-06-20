'use client';

import type { Word } from '@prisma/client';
import { RectoCard } from './faces/RectoCard';
import { VersoCard } from './faces/VersoCard';
import { FlashcardMotion } from './FlashCardMotion';
import { formatConcept } from '@/lib/utils';

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

  const displayTerms = formatConcept(word.term, word.synonyms);

  const rectoText = isReverse ? word.translation : displayTerms;
  const versoText = isReverse ? displayTerms : word.translation;

  return (
    <FlashcardMotion isFlipped={isFlipped} onFlip={onFlip}>
      <RectoCard text={rectoText} mandatoryTag={word.mandatoryTag} />
      <VersoCard word={word} mainText={versoText} />
    </FlashcardMotion>
  );
};
