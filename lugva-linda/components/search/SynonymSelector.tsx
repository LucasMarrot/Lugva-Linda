'use client';

import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { searchWords } from '@/actions/word-actions';
import { Word } from '@prisma/client';

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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);

  useEffect(() => {
    if (query.trim().length === 0) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await searchWords(query.trim(), currentLangId);
        const filtered = res.filter(
          (r) =>
            r.term.toLowerCase() !== currentWord.trim().toLowerCase() &&
            !selectedSynonyms.includes(r.term),
        );
        setResults(filtered);
      } catch (error) {
        console.error('Erreur recherche synonymes:', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentLangId, currentWord, selectedSynonyms]);

  const addSynonym = (word: string) => {
    setSelectedSynonyms((prev) => [...prev, word]);
    setQuery('');
    setIsOpen(false);
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
            <span
              key={syn}
              className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
            >
              {syn}
              <button
                type="button"
                onClick={() => removeSynonym(syn)}
                className="hover:text-foreground opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!isOpen ? (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="text-muted-foreground bg-muted/30 hover:bg-muted/50 h-12 w-full justify-start border-transparent"
        >
          <LinkIcon className="mr-2 h-4 w-4" /> Rechercher un mot existant...
        </Button>
      ) : (
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
              autoFocus
            />
          </div>

          {query && results.length > 0 && (
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {results.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => addSynonym(res.term)}
                  className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                >
                  <span className="text-foreground font-medium">
                    {res.term}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {res.translation}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="text-muted-foreground py-3 text-center text-xs">
              Aucun mot correspondant.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
