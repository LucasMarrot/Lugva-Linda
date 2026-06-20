'use client';

import { useState } from 'react';
import { RelatedWordSelector } from './RelatedWordSelector';

type RelatedWordsSectionProps = {
  currentLangId: string;
  currentWord: string;
  initialRelatedWords?: string[];
};

export const RelatedWordsSection = ({
  currentLangId,
  currentWord,
  initialRelatedWords = [],
}: RelatedWordsSectionProps) => {
  const [selectedRelatedWords, setSelectedRelatedWords] =
    useState<string[]>(initialRelatedWords);

  return (
    <>
      {selectedRelatedWords.map((word) => (
        <input key={word} type="hidden" name="relatedWords" value={word} />
      ))}

      <RelatedWordSelector
        currentLangId={currentLangId}
        currentWord={currentWord}
        selectedRelatedWords={selectedRelatedWords}
        setSelectedRelatedWords={setSelectedRelatedWords}
      />
    </>
  );
};
