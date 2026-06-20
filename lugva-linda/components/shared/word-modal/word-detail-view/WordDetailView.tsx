'use client';

import { Tag } from 'lucide-react';
import { Badge, DialogFooter, Separator } from '@/components/ui';

import {
  AudioPlayer,
  RichTextViewer,
  SectionHeader,
} from '@/components/shared/';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { WordActions } from './WordActions';
import { RelatedWordsList } from '../RelatedWordsList';
import { formatConcept } from '@/lib/utils';

type WordDetailViewProps = {
  word: EditableWordSnapshot;
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onEdit?: () => void;
  onDelete?: (wordId: string) => void;
  onAddExternalWord?: (word: EditableWordSnapshot) => Promise<void>;
  isAddingExternalWord?: boolean;
  onRelatedWordSelect: (word: string) => void;
};

export const WordDetailView = ({
  word,
  canEdit = false,
  canDelete = false,
  canAdd = false,
  onEdit,
  onDelete,
  onAddExternalWord,
  isAddingExternalWord = false,
  onRelatedWordSelect,
}: WordDetailViewProps) => {
  const isExternalWord = canAdd;

  const displayTerms = formatConcept(word.term, word.synonyms);

  return (
    <>
      <div className="max-h-[70dvh] min-h-0 flex-1 space-y-8 overflow-x-hidden overflow-y-auto p-6">
        <div className="space-y-2 text-center">
          <h2
            className="text-primary text-4xl font-extrabold"
            style={
              isExternalWord && word.ownerColorHex
                ? { color: word.ownerColorHex }
                : undefined
            }
          >
            {displayTerms}
          </h2>
          <p className="text-foreground text-xl font-medium">
            {word.translation}
          </p>

          {isExternalWord && word.ownerName && (
            <p className="text-muted-foreground text-xs">
              Propriétaire : {word.ownerName}
            </p>
          )}
        </div>

        {word.tags && word.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {word.tags.map((tag, index) => (
              <Badge
                key={tag + String(index)}
                variant={index === 0 ? 'secondaryOutline' : 'outline'}
                className="p-2 px-4 text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  {index === 0 && <Tag className="h-4 w-4" />}

                  {tag}
                </span>
              </Badge>
            ))}
          </div>
        )}

        {word.customAudioUrl && (
          <>
            <Separator />
            <div className="space-y-3">
              <SectionHeader title="Prononciation" />
              <AudioPlayer audioUrl={word.customAudioUrl} />
            </div>
          </>
        )}

        {word.relatedWords && word.relatedWords.length > 0 && (
          <>
            <Separator />
            <RelatedWordsList
              relatedWords={word.relatedWords}
              onRelatedWordClick={onRelatedWordSelect}
            />
          </>
        )}

        {word.notesBlocks && word.notesBlocks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <SectionHeader title="Notes" />
              <RichTextViewer blocks={word.notesBlocks} />
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <WordActions
          canEdit={canEdit}
          canDelete={canDelete}
          canAdd={canAdd}
          onEdit={canEdit ? onEdit : undefined}
          onDelete={canDelete && onDelete ? () => onDelete(word.id) : undefined}
          onAdd={
            canAdd && onAddExternalWord
              ? () => onAddExternalWord(word)
              : undefined
          }
          isAdding={isAddingExternalWord}
        />
      </DialogFooter>
    </>
  );
};
