'use client'

import { useWordModal } from '../providers/WordModalProvider'
import { AlphabetNav } from './AlphabetNav'
import { WordListItem } from './WordListItem'
import { Word } from '@prisma/client'

type EncyclopediaClientProps = {
  words: Word[]
}

export const EncyclopediaClient = ({ words }: EncyclopediaClientProps) => {
  const { openWord } = useWordModal()

  const groupedWords = words.reduce(
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

  const sortedLetters = Object.keys(groupedWords).sort()

  return (
    <div className="relative min-h-screen pb-24">
      <AlphabetNav availableLetters={sortedLetters} />

      <div className="space-y-8 px-4 pr-14">
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

        {words.length === 0 && (
          <div className="text-muted-foreground py-20 text-center">
            Votre encyclopédie est vide.
          </div>
        )}
      </div>
    </div>
  )
}
