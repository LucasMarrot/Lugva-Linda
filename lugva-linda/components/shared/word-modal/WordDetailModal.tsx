'use client';

import { useCallback } from 'react';
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
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type WordDetailModalProps = {
  word: EditableWordSnapshot | null;
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onEditSuccess?: () => void;
  onRelatedWordSelect: (word: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onDelete?: (wordId: string) => void;
  onAddExternalWord?: (word: EditableWordSnapshot) => Promise<void>;
  isAddingExternalWord?: boolean;
  isContributorMode?: boolean;
  // ─── Navigation ──────────────────────────────────────────────────────────
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
};

export const WordDetailModal = ({
  word,
  isOpen,
  onClose,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onEditSuccess,
  onRelatedWordSelect,
  canEdit = false,
  canDelete = false,
  canAdd = false,
  onDelete,
  onAddExternalWord,
  isAddingExternalWord = false,
  isContributorMode = false,
  onNavigate,
  hasPrev = false,
  hasNext = false,
  currentIndex = -1,
  totalCount = 0,
}: WordDetailModalProps) => {
  const canNavigate = !!onNavigate && totalCount > 1;

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (canNavigate && !isEditing) {
        onNavigate!(direction);
      }
    },
    [canNavigate, isEditing, onNavigate],
  );

  // Swipe tactile + flèches clavier — désactivé en mode édition
  useSwipeNavigation({
    onNavigate: handleNavigate,
    disabled: !isOpen || isEditing || !canNavigate,
  });

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
              <>
                {/* Indicateur de position */}
                {canNavigate && currentIndex !== -1 && (
                  <div className="text-muted-foreground flex items-center justify-center gap-2 pt-0 pb-1 text-xs">
                    <span>
                      {currentIndex + 1} / {totalCount}
                    </span>
                  </div>
                )}

                <WordDetailView
                  word={word}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canAdd={canAdd}
                  onEdit={onStartEdit}
                  onDelete={onDelete}
                  onAddExternalWord={onAddExternalWord}
                  isAddingExternalWord={isAddingExternalWord}
                  onRelatedWordSelect={onRelatedWordSelect}
                />

                {/* Boutons de navigation prev / next */}
                {canNavigate && (
                  <div className="border-border/50 flex items-center justify-between border-t px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleNavigate('prev')}
                      disabled={!hasPrev}
                      aria-label="Mot précédent"
                      className={cn(
                        'text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                        'disabled:pointer-events-none disabled:opacity-30',
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('next')}
                      disabled={!hasNext}
                      aria-label="Mot suivant"
                      className={cn(
                        'text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                        'disabled:pointer-events-none disabled:opacity-30',
                      )}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
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
                  isContributorMode={isContributorMode}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
