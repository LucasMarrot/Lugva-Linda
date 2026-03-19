'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchWords } from '@/actions/word-actions';
import { SearchResultItem } from './SearchResultItem';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { StateMessage } from '@/components/shared/StateMessage';
import { Word } from '@prisma/client';

type SearchViewProps = {
  query: string;
  setQuery: (q: string) => void;
  currentLangId: string;
  onCreateClick: () => void;
};

export const SearchView = ({
  query,
  setQuery,
  currentLangId,
  onCreateClick,
}: SearchViewProps) => {
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      latestRequestRef.current += 1;
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchWords(trimmedQuery, currentLangId);

        if (latestRequestRef.current !== requestId) {
          return;
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        if (latestRequestRef.current !== requestId) {
          return;
        }

        setSearchResults([]);
        setSearchError(
          'Impossible de lancer la recherche. Merci de reessayer.',
        );
      } finally {
        if (latestRequestRef.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentLangId]);

  const exactMatchExists = searchResults.some(
    (w) => w.term.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-3.5 left-4 h-5 w-5" />
        <Input
          autoFocus
          placeholder="Chercher ou ajouter un mot..."
          className="bg-muted/50 focus-visible:ring-primary h-12 rounded-xl border-transparent pl-12 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length > 0 && (
        <div className="space-y-4">
          {!exactMatchExists && (
            <Button
              variant="outline"
              onClick={onCreateClick}
              className="ui-motion-interactive ui-tap-feedback hover:bg-primary/5 hover:border-primary/50 hover:text-primary h-16 w-full justify-start border-2 border-dashed text-left font-normal"
            >
              <Plus className="text-primary mr-3 h-6 w-6" />
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm leading-tight">
                  Nouveau mot
                </span>
                <span className="max-w-[250px] truncate text-base font-semibold">
                  {query}
                </span>
              </div>
            </Button>
          )}

          {exactMatchExists && (
            <StateMessage
              tone="info"
              message="Ce mot est deja dans votre encyclopedie."
            />
          )}

          <div className="px-2 pt-2">
            <SectionHeader title="Resultats" className="mb-3" />

            <div className="space-y-2">
              {searchError ? (
                <StateMessage tone="error" message={searchError} />
              ) : isSearching ? (
                <StateMessage tone="info" message="Recherche en cours..." />
              ) : searchResults.length === 0 ? (
                <StateMessage
                  tone="neutral"
                  message="Aucun mot similaire trouve."
                />
              ) : (
                searchResults.map((word) => (
                  <SearchResultItem key={word.id} word={word} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
