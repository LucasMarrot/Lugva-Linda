'use client';

import { SectionHeader } from '@/components/shared';
import { TagSelector } from './TagSelector';

type NatureSectionProps = {
  selectedMandatoryTag: string | null;
  errorMessage?: string | null;
  onSelectTag: (tag: string) => void;
};

export const NatureSection = ({
  selectedMandatoryTag,
  errorMessage,
  onSelectTag,
}: NatureSectionProps) => {
  return (
    <div className="space-y-3">
      <SectionHeader title="Nature" />
      <TagSelector
        selectedTag={selectedMandatoryTag}
        onSelectTag={onSelectTag}
      />
      {errorMessage && (
        <p className="text-destructive text-sm font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
