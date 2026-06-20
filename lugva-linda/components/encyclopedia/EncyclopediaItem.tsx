import { getWordVisualMeta, toWordSnapshot } from '@/hooks/useWordSnapshot';
import { WordListItem } from '../shared';
import { EditableWordSnapshot } from '@/lib/words/community';
import type { VisualWord } from './EncyclopediaClient';

type EncyclopediaItemProps = {
  visualWord: VisualWord;
  mode: 'owner' | 'external';
  addingWordId: string | null;
  onImport: (id: string) => void;
  onOpen: (snapshot: EditableWordSnapshot) => void;
};

export const EncyclopediaItem = ({
  visualWord,
  mode,
  addingWordId,
  onImport,
  onOpen,
}: EncyclopediaItemProps) => {
  const visualMeta = getWordVisualMeta(visualWord.originalWord, mode);

  const displayWord = {
    ...visualWord.originalWord,
    term: visualWord.displayTerm,
    synonyms: visualWord.displaySynonyms,
  };

  return (
    <WordListItem
      word={displayWord}
      ownerName={visualMeta.ownerName}
      primaryColor={visualMeta.primaryColor}
      onAdd={
        visualMeta.isExternal && addingWordId !== visualWord.originalWord.id
          ? () => onImport(visualWord.originalWord.id)
          : undefined
      }
      onClick={() => onOpen(toWordSnapshot(visualWord.originalWord, mode))}
    />
  );
};
