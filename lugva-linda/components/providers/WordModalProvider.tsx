'use client';

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { WordDetailModal } from '@/components/shared/word-modal/WordDetailModal';
import { useToast } from '@/components/providers/ToastProvider';
import { deleteWordAction, getWordByTextAction } from '@/actions/word-actions';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { useCommunityImport } from '@/hooks/useCommunityImport';
import { toWordSnapshot } from '@/hooks/useWordSnapshot';

type WordModalContextType = {
  openWord: (word: EditableWordSnapshot) => void;
};

const WordModalContext = createContext<WordModalContextType | undefined>(
  undefined,
);

export const WordModalProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeWord, setActiveWord] = useState<EditableWordSnapshot | null>(
    null,
  );
  const { addingWordId, importWord } = useCommunityImport();
  const toast = useToast();

  const openWord = (word: EditableWordSnapshot) => {
    setActiveWord(word);
  };

  const closeWord = () => {
    setActiveWord(null);
  };

  const handleSynonymSelect = async (synonymText: string) => {
    if (!activeWord) return;

    try {
      const foundWord = await getWordByTextAction(
        synonymText,
        activeWord.languageId,
      );

      if (foundWord) {
        setActiveWord(toWordSnapshot(foundWord, 'owner'));
      } else {
        toast.info(
          `Le mot "${synonymText}" n'a pas encore de fiche dans votre encyclopedie.`,
        );
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du synonyme :', error);
      toast.error(
        'Une erreur est survenue pendant la recherche du synonyme. Reessayez.',
      );
    }
  };

  const handleDelete = async (wordId: string) => {
    try {
      await deleteWordAction(wordId);
      closeWord();
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      toast.error('Une erreur est survenue lors de la suppression.');
    }
  };

  const handleAddExternalWord = async (word: EditableWordSnapshot) => {
    if (word.isOwnedByCurrentUser) {
      return;
    }

    await importWord(word.id, closeWord);
  };

  return (
    <WordModalContext.Provider value={{ openWord }}>
      {children}
      <WordDetailModal
        isOpen={!!activeWord}
        word={activeWord}
        onClose={closeWord}
        onSynonymSelect={handleSynonymSelect}
        canEdit={!!activeWord?.isOwnedByCurrentUser}
        canDelete={!!activeWord?.isOwnedByCurrentUser}
        canAdd={!!activeWord && !activeWord.isOwnedByCurrentUser}
        onDelete={handleDelete}
        onAddExternalWord={handleAddExternalWord}
        isAddingExternalWord={addingWordId === activeWord?.id}
      />
    </WordModalContext.Provider>
  );
};

export const useWordModal = () => {
  const context = useContext(WordModalContext);
  if (!context)
    throw new Error('useWordModal doit être utilisé dans un WordModalProvider');
  return context;
};
