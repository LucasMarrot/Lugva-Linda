'use client';

import { Button } from '@/components/ui';
import { SectionHeader } from '@/components/shared';

type RelatedWordsListProps = {
  relatedWords: string[];
  onRelatedWordClick: (word: string) => void;
};

export const RelatedWordsList = ({
  relatedWords,
  onRelatedWordClick,
}: RelatedWordsListProps) => {
  if (!relatedWords || relatedWords.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title="Mots liés" />
      <div className="flex flex-wrap gap-2">
        {relatedWords.map((word) => (
          <Button
            key={word}
            variant="outline"
            onClick={() => onRelatedWordClick(word)}
          >
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
};
