import { Word } from '@prisma/client';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WordListItemProps = {
  word: Word;
  onClick: () => void;
  onRedirect?: (e: React.MouseEvent) => void;
};

export const WordListItem = ({
  word,
  onClick,
  onRedirect,
}: WordListItemProps) => {
  return (
    <div
      id={`word-${word.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="ui-motion-interactive ui-tap-feedback bg-card border-border/50 hover:bg-accent hover:border-border active:bg-accent/80 flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border p-4 text-left"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-foreground truncate text-lg font-semibold">
          {word.term}
        </span>
        <span className="text-muted-foreground truncate text-sm">
          {word.translation}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {word.tags && word.tags.length > 0 && (
          <span className="bg-primary/10 text-primary inline-flex h-6 items-center justify-center rounded-full px-3 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase sm:text-xs">
            {word.tags[0]}
          </span>
        )}

        {onRedirect && (
          <Button
            variant="ghost"
            size="icon"
            className="ui-motion-interactive ui-tap-feedback hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRedirect(e);
            }}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
