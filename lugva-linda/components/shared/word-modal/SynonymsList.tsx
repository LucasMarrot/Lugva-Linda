'use client';

import { Button } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

type SynonymsListProps = {
  synonyms: string[];
  onSynonymClick: (synonym: string) => void;
};

export const SynonymsList = ({
  synonyms,
  onSynonymClick,
}: SynonymsListProps) => {
  if (!synonyms || synonyms.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title="Synonymes" />
      <div className="flex flex-wrap gap-2">
        {synonyms.map((syn) => (
          <Button
            key={syn}
            variant="outline"
            onClick={() => onSynonymClick(syn)}
          >
            {syn}
          </Button>
        ))}
      </div>
    </div>
  );
};
