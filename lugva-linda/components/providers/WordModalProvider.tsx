'use client';

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';
import { WordDetailModal } from '@/components/shared/';
import { useToast } from '@/components/providers/ToastProvider';
import { deleteWordAction, getWordByTextAction } from '@/actions/word-actions';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { useCommunityImport } from '@/hooks/useCommunityImport';
import { toWordSnapshot } from '@/hooks/useWordSnapshot';

type WordModalContextType = {
  openWord: (word: EditableWordSnapshot) => void;
};

type WordModalState =
  | { mode: 'closed'; word: null }
  | { mode: 'detail' | 'edit'; word: EditableWordSnapshot };

type WordModalAction =
  | { type: 'OPEN_WORD'; payload: EditableWordSnapshot }
  | { type: 'CLOSE_MODAL' }
  | { type: 'OPEN_EDIT' }
  | { type: 'CLOSE_EDIT' }
  | { type: 'REPLACE_WORD'; payload: EditableWordSnapshot };

const initialWordModalState: WordModalState = {
  mode: 'closed',
  word: null,
};

const wordModalReducer = (
  state: WordModalState,
  action: WordModalAction,
): WordModalState => {
  switch (action.type) {
    case 'OPEN_WORD':
      return { mode: 'detail', word: action.payload };
    case 'CLOSE_MODAL':
      return initialWordModalState;
    case 'OPEN_EDIT':
      if (state.mode === 'closed') {
        return state;
      }
      return { mode: 'edit', word: state.word };
    case 'CLOSE_EDIT':
      if (state.mode === 'closed') {
        return state;
      }
      return { mode: 'detail', word: state.word };
    case 'REPLACE_WORD':
      if (state.mode === 'closed') {
        return { mode: 'detail', word: action.payload };
      }
      return {
        mode: state.mode === 'edit' ? 'edit' : 'detail',
        word: action.payload,
      };
    default:
      return state;
  }
};

const WordModalContext = createContext<WordModalContextType | undefined>(
  undefined,
);

export const WordModalProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modalState, dispatch] = useReducer(
    wordModalReducer,
    initialWordModalState,
  );
  const { addingWordId, importWord } = useCommunityImport();
  const toast = useToast();

  const activeWord = modalState.word;
  const isModalOpen = modalState.mode !== 'closed';
  const isEditing = modalState.mode === 'edit';

  const openWord = (word: EditableWordSnapshot) => {
    dispatch({ type: 'OPEN_WORD', payload: word });
  };

  const closeWord = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const startEditing = () => {
    dispatch({ type: 'OPEN_EDIT' });
  };

  const cancelEditing = () => {
    dispatch({ type: 'CLOSE_EDIT' });
  };

  const handleSynonymSelect = async (synonymText: string) => {
    if (!activeWord) return;

    try {
      const foundWord = await getWordByTextAction(
        synonymText,
        activeWord.languageId,
      );

      if (foundWord) {
        dispatch({
          type: 'REPLACE_WORD',
          payload: toWordSnapshot(foundWord, 'owner'),
        });
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
        isOpen={isModalOpen}
        word={activeWord}
        onClose={closeWord}
        isEditing={isEditing}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onEditSuccess={closeWord}
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
