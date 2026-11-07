'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { getEntryKey, type NavigationDirection } from '@/lib/words/navigation';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

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
  // ─── Navigation (swipe + flèches clavier uniquement) ─────────────────────
  onNavigate?: (direction: NavigationDirection) => void;
  currentIndex?: number;
  totalCount?: number;
};

// Sens du glissement : 1 = le mot suivant arrive par la droite
const slideVariants = {
  enter: (direction: number) => ({ x: direction * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -40, opacity: 0 }),
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
  currentIndex = -1,
  totalCount = 0,
}: WordDetailModalProps) => {
  const [direction, setDirection] = useState<1 | -1>(1);
  const canNavigate = !!onNavigate && totalCount > 1 && currentIndex !== -1;

  const handleNavigate = useCallback(
    (navigationDirection: NavigationDirection) => {
      if (canNavigate && !isEditing) {
        setDirection(navigationDirection === 'next' ? 1 : -1);
        onNavigate!(navigationDirection);
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
                {canNavigate && (
                  <div className="text-muted-foreground flex items-center justify-center gap-2 pt-0 pb-1 text-xs">
                    <span>
                      {currentIndex + 1} / {totalCount}
                    </span>
                  </div>
                )}

                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={getEntryKey(word)}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
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
                  </motion.div>
                </AnimatePresence>
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
