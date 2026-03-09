'use client'

import { useState, useMemo } from 'react'
import { useWordModal } from '../providers/WordModalProvider'
import { AlphabetNav } from './AlphabetNav'
import { WordListItem } from './WordListItem'
import { TagFilter } from './TagFilter'
import { Word } from '@prisma/client'

type EncyclopediaClientProps = {
  words: Word[]
}

export const EncyclopediaClient = ({ words }: EncyclopediaClientProps) => {
  const { openWord } = useWordModal()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    words.forEach((word) => {
      if (word.tags && word.tags.length > 0) {
        word.tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [words])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const filteredWords = useMemo(() => {
    if (selectedTags.length === 0) return words
    return words.filter((word) =>
      word.tags?.some((tag) => selectedTags.includes(tag)),
    )
  }, [words, selectedTags])

  const groupedWords = useMemo(() => {
    return filteredWords.reduce(
      (acc, word) => {
        const firstLetter = word.word
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .charAt(0)
          .toUpperCase()
        if (!acc[firstLetter]) acc[firstLetter] = []
        acc[firstLetter].push(word)
        return acc
      },
      {} as Record<string, Word[]>,
    )
  }, [filteredWords])

  const sortedLetters = Object.keys(groupedWords).sort()

  return (
    <div className="relative min-h-screen pb-24">
      <TagFilter
        allTags={allTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        onClearTags={() => setSelectedTags([])}
      />

      <AlphabetNav availableLetters={sortedLetters} />

      <div className="space-y-8 px-4 pt-2 pr-14">
        {sortedLetters.map((letter) => (
          <div key={letter} id={`letter-${letter}`} className="scroll-mt-20">
            <h2 className="text-primary border-border/50 bg-background/95 sticky top-16 z-10 mb-4 border-b pb-2 text-xl font-bold backdrop-blur-sm">
              {letter}
            </h2>

            <div className="space-y-3">
              {groupedWords[letter].map((word) => (
                <WordListItem
                  key={word.id}
                  word={word}
                  onClick={() => openWord(word)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredWords.length === 0 && (
          <div className="text-muted-foreground py-20 text-center text-sm font-medium">
            {selectedTags.length > 0
              ? 'Aucun mot trouvé pour la sélection actuelle.'
              : 'Votre encyclopédie est vide.'}
          </div>
        )}
      </div>
    </div>
  )
}
