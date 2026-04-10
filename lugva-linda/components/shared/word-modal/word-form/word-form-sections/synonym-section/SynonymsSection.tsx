'use client';

import { useState } from 'react';
import { SynonymSelector } from './SynonymSelector';

type SynonymsSectionProps = {
  currentLangId: string;
  currentWord: string;
  initialSynonyms?: string[];
};

export const SynonymsSection = ({
  currentLangId,
  currentWord,
  initialSynonyms = [],
}: SynonymsSectionProps) => {
  const [selectedSynonyms, setSelectedSynonyms] =
    useState<string[]>(initialSynonyms);

  return (
    <>
      {selectedSynonyms.map((syn) => (
        <input key={syn} type="hidden" name="synonyms" value={syn} />
      ))}

      <SynonymSelector
        currentLangId={currentLangId}
        currentWord={currentWord}
        selectedSynonyms={selectedSynonyms}
        setSelectedSynonyms={setSelectedSynonyms}
      />
    </>
  );
};
