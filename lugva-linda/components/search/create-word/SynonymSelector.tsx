'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchWords } from '@/actions/word-actions';
import { type WordCommunityView } from '@/lib/words/community';
import { Badge } from '@/components/ui/badge';

type SynonymSelectorProps = {
  currentLangId: string;
  currentWord: string;
  selectedSynonyms: string[];
  setSelectedSynonyms: React.Dispatch<React.SetStateAction<string[]>>;
};

export const SynonymSelector = ({
  currentLangId,
  currentWord,
  selectedSynonyms,
  setSelectedSynonyms,
}: SynonymSelectorProps) => {
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
            !selectedSynonyms.includes(r.term),
        );
        setResults(filtered);
      } catch (error) {
        console.error('Erreur recherche synonymes:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentLangId, currentWord, selectedSynonyms]);

  const addSynonym = (word: string) => {
    setSelectedSynonyms((prev) => [...prev, word]);
    setQuery('');
  };

  const removeSynonym = (synToRemove: string) => {
    setSelectedSynonyms((prev) => prev.filter((syn) => syn !== synToRemove));
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground font-medium">Lier des synonymes</Label>

      {selectedSynonyms.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedSynonyms.map((syn) => (
            <Badge
              key={syn}
              variant="default"
              onDelete={() => removeSynonym(syn)}
              deleteLabel={'Retirer ' + syn}
            >
              {syn}
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
                onClick={() => addSynonym(res.term)}
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
