import { getWordVisualMeta, toWordSnapshot } from '@/hooks/useWordSnapshot';
import { WordListItem } from '../shared';
import { useUserColor } from '@/hooks/useUserColor';
import { EditableWordSnapshot, WordCommunityView } from '@/lib/words/community';

type SearchWordItemProps = {
  word: WordCommunityView;
  addingWordId: string | null;
  onImport: (id: string) => void;
  onOpen: (snapshot: EditableWordSnapshot) => void;
  onRedirect?: () => void;
};

export const SearchWordItem = ({
  word,
  addingWordId,
  onImport,
  onOpen,
  onRedirect,
}: SearchWordItemProps) => {
  const mode = word.isOwnedByCurrentUser ? 'owner' : 'external';
  const visualMeta = getWordVisualMeta(word, mode);
  const dynamicColor = useUserColor(visualMeta.primaryColor);

  return (
    <WordListItem
      word={word}
      ownerName={visualMeta.ownerName}
      primaryColor={dynamicColor}
      onAdd={
        !word.isOwnedByCurrentUser && addingWordId !== word.id
          ? () => onImport(word.id)
          : undefined
      }
      onRedirect={onRedirect}
      onClick={() => onOpen(toWordSnapshot(word, mode))}
    />
  );
};
