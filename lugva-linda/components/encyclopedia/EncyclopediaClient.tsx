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
import { frenchPluralize } from '@/lib/utils';

export type VisualWord = Word & {
  visualId: string;
  displayTerm: string;
  displaySynonyms: string[];
  originalWord: Word;
};

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

  const visualWords: VisualWord[] = useMemo(() => {
    const flatArray = words.flatMap((word) => {
      const entries: VisualWord[] = [
        {
          ...word,
          visualId: `${word.id}-main`,
          displayTerm: word.term,
          displaySynonyms: word.synonyms || [],
          originalWord: word,
        },
      ];

      if (word.synonyms && word.synonyms.length > 0) {
        word.synonyms.forEach((syn, index) => {
          entries.push({
            ...word,
            visualId: `${word.id}-syn-${index}`,
            displayTerm: syn,
            displaySynonyms: [
              word.term,
              ...word.synonyms.filter((s) => s !== syn),
            ],
            originalWord: word,
          });
        });
      }

      return entries;
    });

    return flatArray.sort((a, b) =>
      a.displayTerm.localeCompare(b.displayTerm, 'fr', { sensitivity: 'base' }),
    );
  }, [words]);

  const filteredWords = useMemo(() => {
    if (selectedTags.length === 0) return visualWords;
    return visualWords.filter((vw) =>
      vw.tags?.some((tag) => selectedTags.includes(tag)),
    );
  }, [visualWords, selectedTags]);

  const groupedWords = useMemo(() => {
    return filteredWords.reduce(
      (acc, vw) => {
        const firstLetter = vw.displayTerm
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .charAt(0)
          .toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(vw);
        return acc;
      },
      {} as Record<string, VisualWord[]>,
    );
  }, [filteredWords]);

  const sortedLetters = Object.keys(groupedWords).sort();

  return (
    <div className="relative min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
      {words.length > 0 && (
        <div className="px-4 pb-3">
          <h3 className="text-muted-foreground text-sm font-medium">
            {`${words.length} ${frenchPluralize(words.length, 'mot')} au total`}
          </h3>
        </div>
      )}

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
              <div className="space-y-3">
                {groupedWords[letter].map((vw) => (
                  <EncyclopediaItem
                    key={vw.visualId}
                    visualWord={vw}
                    mode={mode}
                    addingWordId={addingWordId}
                    onImport={importWord}
                    onOpen={openWord}
                  />
                ))}
              </div>
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
