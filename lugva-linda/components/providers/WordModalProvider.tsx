'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { WordDetailModal } from '@/components/shared/word-modal/WordDetailModal'
import { deleteWordAction, getWordByTextAction } from '@/actions/word-actions'
import { Word } from '@prisma/client'

type WordModalContextType = {
  openWord: (word: Word) => void
}

const WordModalContext = createContext<WordModalContextType | undefined>(
  undefined,
)

export const WordModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeWord, setActiveWord] = useState<Word | null>(null)
  const router = useRouter()

  const openWord = (word: Word) => setActiveWord(word)
  const closeWord = () => setActiveWord(null)

  const handleSynonymSelect = async (synonymText: string) => {
    if (!activeWord) return

    try {
      const foundWord = await getWordByTextAction(
        synonymText,
        activeWord.languageId,
      )

      if (foundWord) {
        setActiveWord(foundWord)
      } else {
        alert(
          `Le mot "${synonymText}" n'a pas encore de fiche dans votre encyclopédie.`,
        )
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du synonyme :', error)
    }
  }

  const handleDelete = async (wordId: string) => {
    try {
      await deleteWordAction(wordId)
      closeWord()
    } catch (error) {
      console.error('Erreur lors de la suppression :', error)
      alert('Une erreur est survenue lors de la suppression.')
    }
  }

  return (
    <WordModalContext.Provider value={{ openWord }}>
      {children}
      <WordDetailModal
        isOpen={!!activeWord}
        word={activeWord}
        onClose={closeWord}
        onSynonymSelect={handleSynonymSelect}
        onDelete={handleDelete}
      />
    </WordModalContext.Provider>
  )
}

export const useWordModal = () => {
  const context = useContext(WordModalContext)
  if (!context)
    throw new Error('useWordModal doit être utilisé dans un WordModalProvider')
  return context
}
