'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input, Badge } from '@/components/ui';
import { searchWords } from '@/actions/word-actions';
import { type WordCommunityView } from '@/lib/words/community';
import { SectionHeader } from '@/components/shared';

type RelatedWordSelectorProps = {
  currentLangId: string;
  currentWord: string;
  selectedRelatedWords: string[];
  setSelectedRelatedWords: React.Dispatch<React.SetStateAction<string[]>>;
};

export const RelatedWordSelector = ({
  currentLangId,
  currentWord,
  selectedRelatedWords,
  setSelectedRelatedWords,
}: RelatedWordSelectorProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<WordCommunityView[]>([]);

  useEffect(() => {
    if (query.trim().length === 0) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await searchWords(query.trim(), currentLangId);
        const filtered = res.filter(
          (r) =>
            r.isOwnedByCurrentUser &&
            r.term.toLowerCase() !== currentWord.trim().toLowerCase() &&
            !selectedRelatedWords.includes(r.term),
        );
        setResults(filtered);
      } catch (error) {
        console.error('Erreur recherche mots liés:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentLangId, currentWord, selectedRelatedWords]);

  const addRelatedWord = (word: string) => {
    setSelectedRelatedWords((prev) => [...prev, word]);
    setQuery('');
  };

  const removeRelatedWord = (wordToRemove: string) => {
    setSelectedRelatedWords((prev) =>
      prev.filter((word) => word !== wordToRemove),
    );
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Mots liés"
        description="Associez des mots du même champ lexical (ex: Hi / Hello)"
      />

      {selectedRelatedWords.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedRelatedWords.map((word) => (
            <Badge
              key={word}
              variant="default"
              onDelete={() => removeRelatedWord(word)}
              deleteLabel={'Retirer ' + word}
            >
              {word}
            </Badge>
          ))}
        </div>
      )}

      <div className="border-border/50 bg-muted/20 animate-in fade-in space-y-2 rounded-xl border p-3 duration-200">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Tapez un mot..."
            className="bg-background h-9 pl-9"
            value={query}
            onChange={(e) => {
              const nextQuery = e.target.value;
              if (nextQuery.trim().length === 0) {
                setResults([]);
              }
              setQuery(nextQuery);
            }}
          />
        </div>

        {isLoading && (
          <div className="text-muted-foreground py-3 text-center text-xs">
            Recherche en cours...
          </div>
        )}

        {!isLoading && query && results.length > 0 && (
          <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {results.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => addRelatedWord(res.term)}
                className="hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
              >
                <span className="text-foreground font-medium">{res.term}</span>
                <span className="text-muted-foreground text-xs">
                  {res.translation}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="text-muted-foreground py-3 text-center text-xs">
            Aucun mot correspondant.
          </div>
        )}
      </div>
    </div>
  );
};
