import type { MouseEventHandler } from 'react';
import type { Word } from '@prisma/client';
import { BookOpen, Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

type WordListItemProps = {
  word: Word;
  ownerName?: string;
  primaryColor?: string;
  onClick: () => void;
  onRedirect?: MouseEventHandler<HTMLButtonElement>;
  onAdd?: MouseEventHandler<HTMLButtonElement>;
};

export const WordListItem = ({
  word,
  ownerName,
  primaryColor,
  onClick,
  onRedirect,
  onAdd,
}: WordListItemProps) => {
  const customCardStyle = primaryColor
    ? {
        borderLeftColor: `${primaryColor}`,
      }
    : undefined;

  return (
    <div
      id={`word-${word.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="ui-motion-interactive ui-tap-feedback bg-card border-border/50 hover:bg-accent hover:border-border active:bg-accent/80 flex w-full cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-xl border-2 p-3 text-left sm:gap-3 sm:p-4"
      style={customCardStyle}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span
          className="truncate text-base font-semibold sm:text-lg"
          style={primaryColor ? { color: primaryColor } : undefined}
        >
          {word.term}
        </span>
        <span className="text-muted-foreground truncate text-xs sm:text-sm">
          {word.translation}
        </span>

        {ownerName && (
          <span
            className="truncate text-[11px] font-medium sm:text-xs"
            style={primaryColor ? { color: primaryColor } : undefined}
          >
            {ownerName}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {word.tags &&
          word.tags.length > 0 &&
          word.tags.map((tag, index) => (
            <Badge
              key={tag}
              variant={index === 0 ? 'secondaryOutline' : 'outline'}
            >
              {tag}
            </Badge>
          ))}

        {onAdd && (
          <Button
            variant="default"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(e);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {onRedirect && (
          <Button
            variant="default"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
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
