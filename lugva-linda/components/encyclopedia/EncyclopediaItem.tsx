import { getWordVisualMeta, toWordSnapshot } from '@/hooks/useWordSnapshot';
import { WordListItem } from '../shared';
import { useUserColor } from '@/hooks/useUserColor';
import { Word } from '@prisma/client';
import { EditableWordSnapshot } from '@/lib/words/community';

type EncyclopediaItemProps = {
  word: Word;
  mode: 'owner' | 'external';
  addingWordId: string | null;
  onImport: (id: string) => void;
  onOpen: (snapshot: EditableWordSnapshot) => void;
};

export const EncyclopediaItem = ({
  word,
  mode,
  addingWordId,
  onImport,
  onOpen,
}: EncyclopediaItemProps) => {
  const visualMeta = getWordVisualMeta(word, mode);
  const dynamicColor = useUserColor(visualMeta.primaryColor);

  return (
    <WordListItem
      word={word}
      ownerName={visualMeta.ownerName}
      primaryColor={dynamicColor}
      onAdd={
        visualMeta.isExternal && addingWordId !== word.id
          ? () => onImport(word.id)
          : undefined
      }
      onClick={() => onOpen(toWordSnapshot(word, mode))}
    />
  );
};
