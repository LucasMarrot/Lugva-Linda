'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchWords } from '@/actions/word-actions'
import { SearchResultItem } from './SearchResultItem'
import { Word } from '@prisma/client'

type SearchViewProps = {
  query: string
  setQuery: (q: string) => void
  currentLangId: string
  onCreateClick: () => void
}

export const SearchView = ({
  query,
  setQuery,
  currentLangId,
  onCreateClick,
}: SearchViewProps) => {
  const [searchResults, setSearchResults] = useState<Word[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchWords(query.trim(), currentLangId)
        setSearchResults(results)
      } catch (error) {
        console.error('Erreur lors de la recherche:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, currentLangId])

  const exactMatchExists = searchResults.some(
    (w) => w.word.toLowerCase() === query.trim().toLowerCase(),
  )

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
              className="hover:bg-primary/5 hover:border-primary/50 hover:text-primary h-16 w-full justify-start border-2 border-dashed text-left font-normal transition-colors"
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
            <div className="text-primary bg-primary/10 rounded-lg py-3 text-center text-sm font-medium">
              Ce mot est déjà dans votre encyclopédie.
            </div>
          )}

          <div className="px-2 pt-2">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
              {isSearching ? 'Recherche en cours...' : 'Résultats'}
            </p>

            <div className="space-y-2">
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-muted-foreground bg-muted/30 rounded-lg py-4 text-center text-sm">
                  Aucun mot similaire trouvé.
                </div>
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
  )
}
