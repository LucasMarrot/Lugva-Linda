'use client';

import type { FC, ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/providers/ToastProvider';
import { deleteWordAction, getWordByTextAction } from '@/actions/word-actions';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { useCommunityImport } from '@/hooks/useCommunityImport';
import { toWordSnapshot } from '@/hooks/useWordSnapshot';
import {
  findEntryIndex,
  getAdjacentIndex,
  getNavigableEntries,
  type NavigationDirection,
} from '@/lib/words/navigation';

const WordDetailModal = dynamic(
  () =>
    import('@/components/shared/word-modal/WordDetailModal').then(
      (m) => m.WordDetailModal,
    ),
  { ssr: false },
);

const WordCompleteModal = dynamic(
  () =>
    import('@/components/shared/word-modal/WordCompleteModal').then(
      (m) => m.WordCompleteModal,
    ),
  { ssr: false },
);

type WordModalContextType = {
  openWord: (word: EditableWordSnapshot) => void;
  /** Enregistre la liste de navigation courante (filtrée + triée). */
  setNavigationList: (list: EditableWordSnapshot[]) => void;
};

type WordModalState =
  | { mode: 'closed'; word: null }
  | { mode: 'detail' | 'edit' | 'complete'; word: EditableWordSnapshot };

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
      if (action.payload.status === 'TO_COMPLETE') {
        return { mode: 'complete', word: action.payload };
      }
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

export const WordModalProvider: FC<{
  children: ReactNode;
  isContributorMode?: boolean;
}> = ({ children, isContributorMode = false }) => {
  const [modalState, dispatch] = useReducer(
    wordModalReducer,
    initialWordModalState,
  );

  /** Liste de mots dans laquelle naviguer (suit les filtres actifs). */
  const [navigationList, setNavigationListState] = useState<
    EditableWordSnapshot[]
  >([]);

  // Les mots "À compléter" n'ont pas de fiche de détail : jamais navigables.
  const setNavigationList = useCallback(
    (list: EditableWordSnapshot[]) =>
      setNavigationListState(getNavigableEntries(list)),
    [],
  );

  const { addingWordId, importWord } = useCommunityImport();
  const toast = useToast();

  const activeWord = modalState.word;
  const isModalOpen =
    modalState.mode !== 'closed' && modalState.mode !== 'complete';
  const isEditing = modalState.mode === 'edit';
  const isCompleting = modalState.mode === 'complete';

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

  // ─── Navigation prev/next ─────────────────────────────────────────────────

  const currentIndex = activeWord
    ? findEntryIndex(navigationList, activeWord)
    : -1;

  const navigateTo = useCallback(
    (direction: NavigationDirection) => {
      const nextIndex = getAdjacentIndex(
        navigationList.length,
        currentIndex,
        direction,
      );
      if (nextIndex === null) return;

      const targetWord = navigationList[nextIndex];
      if (targetWord) {
        dispatch({ type: 'REPLACE_WORD', payload: targetWord });
      }
    },
    [navigationList, currentIndex],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const resetSearchIfNeeded = () => {
    if (window.location.pathname === '/search') {
      window.location.assign('/search');
    }
  };

  const handleRelatedWordSelect = async (relatedWordText: string) => {
    if (!activeWord) return;

    try {
      const foundWord = await getWordByTextAction(
        relatedWordText,
        activeWord.languageId,
      );

      if (foundWord) {
        dispatch({
          type: 'REPLACE_WORD',
          payload: toWordSnapshot(foundWord, 'owner'),
        });
      } else {
        toast.info(
          `Le mot "${relatedWordText}" n'a pas encore de fiche dans votre encyclopedie.`,
        );
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du mot lié :', error);
      toast.error(
        'Une erreur est survenue pendant la recherche du mot lié. Reessayez.',
      );
    }
  };

  const handleDelete = async (wordId: string) => {
    try {
      await deleteWordAction(wordId);
      closeWord();
      resetSearchIfNeeded();
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      toast.error('Une erreur est survenue lors de la suppression.');
    }
  };

  const handleEditSuccess = () => {
    closeWord();
    resetSearchIfNeeded();
  };

  const handleAddExternalWord = async (word: EditableWordSnapshot) => {
    if (word.isOwnedByCurrentUser) {
      return;
    }

    await importWord(word.id, closeWord);
  };

  return (
    <WordModalContext.Provider value={{ openWord, setNavigationList }}>
      {children}
      {isModalOpen && activeWord && (
        <WordDetailModal
          isOpen={isModalOpen}
          word={activeWord}
          onClose={closeWord}
          isEditing={isEditing}
          onStartEdit={startEditing}
          onCancelEdit={cancelEditing}
          onEditSuccess={handleEditSuccess}
          onRelatedWordSelect={handleRelatedWordSelect}
          canEdit={!!activeWord?.isOwnedByCurrentUser}
          canDelete={!!activeWord?.isOwnedByCurrentUser && !isContributorMode}
          canAdd={!!activeWord && !activeWord.isOwnedByCurrentUser}
          onDelete={handleDelete}
          onAddExternalWord={handleAddExternalWord}
          isAddingExternalWord={addingWordId === activeWord?.id}
          isContributorMode={isContributorMode}
          onNavigate={navigateTo}
          currentIndex={currentIndex}
          totalCount={navigationList.length}
        />
      )}
      {isCompleting && activeWord && (
        <WordCompleteModal
          isOpen={isCompleting}
          word={activeWord}
          onClose={closeWord}
        />
      )}
    </WordModalContext.Provider>
  );
};

export const useWordModal = () => {
  const context = useContext(WordModalContext);
  if (!context)
    throw new Error('useWordModal doit être utilisé dans un WordModalProvider');
  return context;
};
