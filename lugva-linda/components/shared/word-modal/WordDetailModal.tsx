'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/';
import { WordForm } from '@/components/shared/word-modal/word-form/WordForm';
import { WordDetailView } from './word-detail-view/WordDetailView';
import { type EditableWordSnapshot } from '@/lib/words/community';

type WordDetailModalProps = {
  word: EditableWordSnapshot | null;
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onEditSuccess?: () => void;
  onSynonymSelect: (synonym: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onDelete?: (wordId: string) => void;
  onAddExternalWord?: (word: EditableWordSnapshot) => Promise<void>;
  isAddingExternalWord?: boolean;
};

export const WordDetailModal = ({
  word,
  isOpen,
  onClose,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onEditSuccess,
  onSynonymSelect,
  canEdit = false,
  canDelete = false,
  canAdd = false,
  onDelete,
  onAddExternalWord,
  isAddingExternalWord = false,
}: WordDetailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent fullScreen={isEditing}>
        <DialogTitle>
          {word
            ? isEditing
              ? `Modifier ${word.term}`
              : `Détails de ${word.term}`
            : 'Détails du mot'}
        </DialogTitle>
        <DialogDescription>
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
                  : canAdd
                    ? 'Fiche communautaire'
                    : 'Fiche de vocabulaire'
              }
              onCancel={
                isEditing && canEdit ? (onCancelEdit ?? onClose) : undefined
              }
              onClose={onClose}
            />
            {!isEditing || !canEdit ? (
              <WordDetailView
                word={word}
                canEdit={canEdit}
                canDelete={canDelete}
                canAdd={canAdd}
                onEdit={onStartEdit}
                onDelete={onDelete}
                onAddExternalWord={onAddExternalWord}
                isAddingExternalWord={isAddingExternalWord}
                onSynonymSelect={onSynonymSelect}
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <WordForm
                  initialData={word}
                  onCancel={onCancelEdit ?? onClose}
                  onSuccess={() => {
                    if (onEditSuccess) {
                      onEditSuccess();
                      return;
                    }
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
