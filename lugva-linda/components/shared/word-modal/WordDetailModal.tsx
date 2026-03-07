'use client'

import { X, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { SynonymsList } from './SynonymsList'
import { WordActions } from './WordActions'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { Word } from '@prisma/client'

type WordDetailModalProps = {
  word: Word | null
  isOpen: boolean
  onClose: () => void
  onSynonymSelect: (synonym: string) => void
  onEdit: (wordId: string) => void
  onDelete: (wordId: string) => void
}

export const WordDetailModal = ({
  word,
  isOpen,
  onClose,
  onSynonymSelect,
  onEdit,
  onDelete,
}: WordDetailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background m-0 flex h-[100dvh] w-full max-w-none flex-col overflow-x-hidden rounded-none border-none p-0 sm:m-4 sm:h-auto sm:max-w-md sm:rounded-2xl sm:p-6 [&>button.absolute]:hidden">
        {' '}
        {word && (
          <div className="flex h-full flex-col">
            <div className="border-border/50 flex shrink-0 items-center justify-between border-b p-4">
              <DialogTitle className="sr-only">
                Détails de {word.word}
              </DialogTitle>
              <div className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                Fiche de vocabulaire
              </div>
              <DialogClose className="hover:bg-muted rounded-full p-2 transition-colors">
                <X className="h-6 w-6" />
              </DialogClose>
            </div>

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6 pb-24">
              <div className="space-y-2 text-center">
                <h2 className="text-foreground text-4xl font-extrabold">
                  {word.word}
                </h2>
                <p className="text-primary text-xl font-medium">
                  {word.translation}
                </p>
              </div>

              {word.tags && word.tags.length > 0 && (
                <div className="flex justify-center">
                  <span className="bg-muted inline-flex h-8 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap">
                    <Tag className="text-muted-foreground h-4 w-4 shrink-0" />
                    {word.tags[0]}
                  </span>
                </div>
              )}

              <WordActions
                onEdit={() => onEdit(word.id)}
                onDelete={() => onDelete(word.id)}
              />

              <hr className="border-border/50" />

              {word.customAudio && (
                <div className="space-y-3">
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    Prononciation
                  </h3>
                  <AudioPlayer audioUrl={word.customAudio} />
                </div>
              )}

              <SynonymsList
                synonyms={word.synonyms}
                onSynonymClick={onSynonymSelect}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
