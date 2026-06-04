'use client';

import type { FC } from 'react';
import { useMemo, useState } from 'react';
import type { Word } from '@prisma/client';
import { useWordModal } from '../providers/WordModalProvider';
import { AlphabetNav } from './AlphabetNav';
import { TagFilter } from './TagFilter';
import { StateMessage } from '@/components/shared/';
import { useCommunityImport } from '@/hooks/useCommunityImport';
import { EncyclopediaItem } from './EncyclopediaItem';

type EncyclopediaClientProps = {
  words: Word[];
  mode?: 'owner' | 'external';
  showTagFilter?: boolean;
  showAlphabetNav?: boolean;
  emptyMessage?: string;
};

export const EncyclopediaClient: FC<EncyclopediaClientProps> = ({
  words,
  mode = 'owner',
  showTagFilter = true,
  showAlphabetNav = true,
  emptyMessage = 'Votre encyclopedie est vide.',
}: EncyclopediaClientProps) => {
  const { openWord } = useWordModal();
  const { addingWordId, importWord } = useCommunityImport();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    words.forEach((word) => {
      if (word.tags && word.tags.length > 0) {
        word.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [words]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredWords = useMemo(() => {
    if (selectedTags.length === 0) return words;
    return words.filter((word) =>
      word.tags?.some((tag) => selectedTags.includes(tag)),
    );
  }, [words, selectedTags]);

  const groupedWords = useMemo(() => {
    return filteredWords.reduce(
      (acc, word) => {
        const firstLetter = word.term
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .charAt(0)
          .toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(word);
        return acc;
      },
      {} as Record<string, Word[]>,
    );
  }, [filteredWords]);

  const sortedLetters = Object.keys(groupedWords).sort();

  return (
    <div className="relative min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
      {showTagFilter && (
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={() => setSelectedTags([])}
        />
      )}

      {showAlphabetNav && <AlphabetNav availableLetters={sortedLetters} />}

      <div className="space-y-8 px-4 pt-2 pr-14">
        {sortedLetters.map((letter) => (
          <div key={letter} id={`letter-${letter}`} className="scroll-mt-20">
            <h2 className="text-primary border-border/50 bg-background/95 sticky top-16 z-10 mb-4 border-b pb-2 text-xl font-bold backdrop-blur-sm">
              {letter}
            </h2>

            <div className="space-y-3">
              {groupedWords[letter].map((word) => (
                <EncyclopediaItem
                  key={word.id}
                  word={word}
                  mode={mode}
                  addingWordId={addingWordId}
                  onImport={importWord}
                  onOpen={openWord}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredWords.length === 0 && (
          <StateMessage
            tone="neutral"
            title="Aucun resultat"
            message={
              selectedTags.length > 0
                ? 'Aucun mot trouve pour la selection actuelle.'
                : emptyMessage
            }
            className="mx-auto max-w-md"
          />
        )}
      </div>
    </div>
  );
};
