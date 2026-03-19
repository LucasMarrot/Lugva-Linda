import { useRouter } from 'next/navigation';
import { Word } from '@prisma/client';
import { useWordModal } from '../providers/WordModalProvider';
import { WordListItem } from '../encyclopedia/WordListItem';

type SearchResultItemProps = {
  word: Word;
};

export const SearchResultItem = ({ word }: SearchResultItemProps) => {
  const router = useRouter();
  const { openWord } = useWordModal();

  const handleAction = (action: 'modal' | 'redirect', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    setTimeout(() => {
      if (action === 'modal') {
        openWord(word);
      } else if (action === 'redirect') {
        router.push(`/words?lang=${word.languageId}#word-${word.id}`);

        setTimeout(() => {
          const element = document.getElementById(`word-${word.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            element.classList.add('bg-accent');
            setTimeout(() => element.classList.remove('bg-accent'), 1500);
          }
        }, 100);
      }
    }, 50);
  };

  return (
    <WordListItem
      word={word}
      onClick={() => handleAction('modal')}
      onRedirect={(e) => handleAction('redirect', e)}
    />
  );
};
