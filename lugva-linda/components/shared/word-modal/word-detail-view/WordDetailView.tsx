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
import { SynonymsList } from './SynonymsList';
import { useUserColor } from '@/hooks/useUserColor';

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
  const dynamicColor = useUserColor(word.ownerColorHex);
  const isExternalWord = canAdd;

  return (
    <>
      <div className="min-h-0 flex-1 space-y-8 overflow-x-hidden overflow-y-auto p-6 sm:max-h-[70dvh]">
        <div className="space-y-2 text-center">
          <h2
            className="text-primary text-4xl font-extrabold"
            style={
              isExternalWord && dynamicColor
                ? { color: dynamicColor }
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
