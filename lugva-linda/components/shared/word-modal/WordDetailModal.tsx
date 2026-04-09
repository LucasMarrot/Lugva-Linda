'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Badge,
} from '@/components/ui';
import { SynonymsList } from './SynonymsList';
import { WordActions } from './WordActions';
import {
  AudioPlayer,
  PageHeader,
  RichTextViewer,
  SectionHeader,
} from '@/components/shared/';
import { CreateWordView } from '@/components/search/create-word/CreateWordView';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { cn } from '@/lib/utils';

type WordDetailModalProps = {
  word: EditableWordSnapshot | null;
  isOpen: boolean;
  onClose: () => void;
  onSynonymSelect: (synonym: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onDelete?: (wordId: string) => void;
  onAddExternalWord?: (word: EditableWordSnapshot) => Promise<void>;
  isAddingExternalWord?: boolean;
};

export const WordDetailModal: FC<WordDetailModalProps> = ({
  word,
  isOpen,
  onClose,
  onSynonymSelect,
  canEdit = false,
  canDelete = false,
  canAdd = false,
  onDelete,
  onAddExternalWord,
  isAddingExternalWord = false,
}: WordDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const isExternalWord = !!word && canAdd;
  const isEditingMode = isEditing && canEdit;

  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => setIsEditing(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, word]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'bg-background flex flex-col overflow-hidden p-0 motion-safe:transition-[width,max-width,height,border-radius,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none [&>button.absolute]:hidden',
          isEditingMode
            ? 'h-dvh w-screen max-w-dvw rounded-none border-none shadow-none sm:h-dvh sm:w-screen sm:max-w-dvw sm:rounded-none'
            : 'h-dvh w-full max-w-none rounded-none border-none sm:h-[80dvh] sm:max-w-md sm:rounded-2xl sm:shadow-xl',
        )}
      >
        <DialogTitle className="sr-only">
          {word
            ? isEditing
              ? `Modifier ${word.term}`
              : `Détails de ${word.term}`
            : 'Détails du mot'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {word
            ? `Affiche les détails, les actions et les informations liées au mot ${word.term}.`
            : 'Affiche les détails du mot sélectionné.'}
        </DialogDescription>

        {word && (
          <div className="flex h-full flex-col">
            <PageHeader
              title={
                isEditing
                  ? 'Modifier la fiche'
                  : isExternalWord
                    ? 'Fiche communautaire'
                    : 'Fiche de vocabulaire'
              }
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
              onClose={onClose}
            />

            {!isEditing || !canEdit ? (
              <>
                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
                  <div className="space-y-2 text-center">
                    <h2
                      className="text-4xl font-extrabold"
                      style={
                        isExternalWord && word.ownerColorHex
                          ? { color: word.ownerColorHex }
                          : undefined
                      }
                    >
                      {word.term}
                    </h2>
                    <p className="text-primary text-xl font-medium">
                      {word.translation}
                    </p>

                    {isExternalWord && word.ownerName && (
                      <p className="text-muted-foreground text-xs">
                        Propriétaire: {word.ownerName}
                      </p>
                    )}
                  </div>

                  {word.tags && word.tags.length > 0 && (
                    <div className="flex justify-center gap-2">
                      {word.tags &&
                        word.tags.length > 0 &&
                        word.tags.map((tag, index) => (
                          <span
                            key={tag + index}
                            className={cn(
                              index === 0
                                ? 'bg-secondary text-secondary-foreground border'
                                : 'text-foreground border',
                              'inline-flex h-8 items-center justify-center rounded-full px-4 text-sm font-semibold whitespace-nowrap',
                            )}
                          >
                            {index === 0 && (
                              <Tag className="text-primary h-4 w-4 shrink-0" />
                            )}
                            <Badge variant={'ghost'} className="text-md">
                              {tag}
                            </Badge>
                          </span>
                        ))}
                    </div>
                  )}

                  {word.customAudioUrl && (
                    <>
                      <hr className="border-border/70" />
                      <div className="space-y-3">
                        <SectionHeader title="Prononciation" />
                        <AudioPlayer audioUrl={word.customAudioUrl} />
                      </div>
                    </>
                  )}

                  {word.synonyms && word.synonyms.length > 0 && (
                    <>
                      <hr className="border-border/70" />
                      <SynonymsList
                        synonyms={word.synonyms}
                        onSynonymClick={onSynonymSelect}
                      />
                    </>
                  )}

                  {word.notesBlocks && word.notesBlocks.length > 0 && (
                    <>
                      <hr className="border-border/70" />
                      <div className="space-y-3">
                        <SectionHeader title="Notes" />
                        <RichTextViewer blocks={word.notesBlocks} />
                      </div>
                    </>
                  )}
                </div>

                <div className="border-border/70 bg-background/95 shrink-0 border-t p-4 backdrop-blur-sm sm:rounded-b-2xl">
                  <WordActions
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canAdd={canAdd}
                    onEdit={canEdit ? () => setIsEditing(true) : undefined}
                    onDelete={
                      canDelete && onDelete
                        ? () => onDelete(word.id)
                        : undefined
                    }
                    onAdd={
                      canAdd && onAddExternalWord
                        ? () => onAddExternalWord(word)
                        : undefined
                    }
                    isAdding={isAddingExternalWord}
                  />
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <CreateWordView
                  initialData={word}
                  onCancel={() => setIsEditing(false)}
                  onSuccess={() => {
                    setIsEditing(false);
                    onClose();
                  }}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
