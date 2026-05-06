'use client';

import { Tag } from 'lucide-react';
import { Badge, DialogFooter, Separator } from '@/components/ui';

import {
  AudioPlayer,
  RichTextViewer,
  SectionHeader,
} from '@/components/shared/';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { cn } from '@/lib/utils';
import { WordActions } from './WordActions';
import { SynonymsList } from './SynonymsList';

type WordDetailViewProps = {
  word: EditableWordSnapshot;
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onEdit?: () => void;
  onDelete?: (wordId: string) => void;
  onAddExternalWord?: (word: EditableWordSnapshot) => Promise<void>;
  isAddingExternalWord?: boolean;
  onSynonymSelect: (synonym: string) => void;
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
  onSynonymSelect,
}: WordDetailViewProps) => {
  const isExternalWord = canAdd;

  return (
    <>
      <div className="min-h-0 flex-1 space-y-8 overflow-x-hidden overflow-y-auto p-6">
        <div className="space-y-2 text-center">
          <h2
            className="text-primary text-4xl font-extrabold"
            style={
              isExternalWord && word.ownerColorHex
                ? { color: word.ownerColorHex }
                : undefined
            }
          >
            {word.term}
          </h2>
          <p className="text-foreground text-xl font-medium">
            {word.translation}
          </p>

          {isExternalWord && word.ownerName && (
            <p className="text-muted-foreground text-xs">
              Propriétaire: {word.ownerName}
            </p>
          )}
        </div>

        {word.tags && word.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {word.tags.map((tag, index) => (
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
                  <Tag className="text-foreground h-4 w-4 shrink-0" />
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
            <Separator />
            <div className="space-y-3">
              <SectionHeader title="Prononciation" />
              <AudioPlayer audioUrl={word.customAudioUrl} />
            </div>
          </>
        )}

        {word.synonyms && word.synonyms.length > 0 && (
          <>
            <Separator />
            <SynonymsList
              synonyms={word.synonyms}
              onSynonymClick={onSynonymSelect}
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
