'use client';

import { useEffect, useState } from 'react';
import { listCustomTagsAction } from '@/actions/word-actions';
import { SectionHeader } from '@/components/shared';
import { CustomTagSelector } from './CustomTagSelector';

type CustomTagsSectionProps = {
  langId: string;
  initialSelectedTags?: string[];
};

export const CustomTagsSection = ({
  langId,
  initialSelectedTags = [],
}: CustomTagsSectionProps) => {
  const [selectedCustomTags, setSelectedCustomTags] =
    useState<string[]>(initialSelectedTags);
  const [availableCustomTags, setAvailableCustomTags] = useState<string[]>([]);

  const addCustomTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    setSelectedCustomTags((prev) => {
      const alreadyExists = prev.some(
        (existingTag) =>
          existingTag.toLocaleLowerCase() === trimmedTag.toLocaleLowerCase(),
      );

      if (alreadyExists) {
        return prev;
      }

      return [...prev, trimmedTag];
    });
  };

  const removeCustomTag = (tag: string) => {
    setSelectedCustomTags((prev) => prev.filter((value) => value !== tag));
  };

  useEffect(() => {
    let cancelled = false;

    const loadCustomTags = async () => {
      if (!langId) {
        setAvailableCustomTags([]);
        return;
      }

      try {
        const tags = await listCustomTagsAction(langId);
        if (!cancelled) {
          setAvailableCustomTags(tags);
        }
      } catch {
        if (!cancelled) {
          setAvailableCustomTags([]);
        }
      }
    };

    void loadCustomTags();

    return () => {
      cancelled = true;
    };
  }, [langId]);

  return (
    <div className="space-y-3">
      <SectionHeader title="Tags personnalisés" />

      {selectedCustomTags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      <CustomTagSelector
        availableCustomTags={availableCustomTags}
        selectedCustomTags={selectedCustomTags}
        onAddCustomTag={addCustomTag}
        onRemoveCustomTag={removeCustomTag}
      />
    </div>
  );
};
