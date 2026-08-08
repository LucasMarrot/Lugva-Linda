'use client';

import { useMemo, useRef, type MouseEventHandler } from 'react';
import type { Word } from '@prisma/client';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { WordTags } from './WordTags';

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
  const tags = useMemo(() => word.tags ?? [], [word.tags]);
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

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
      ref={rootRef}
      className={cn(
        "ui-motion-interactive ui-tap-feedback bg-card hover:bg-accent active:bg-accent/80 relative flex w-full cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-xl border-2 p-3 text-left sm:gap-3 sm:p-4",
        word.status === 'TO_COMPLETE'
          ? "border-amber-500 hover:border-amber-600"
          : "border-border/50 hover:border-border"
      )}
      style={customCardStyle}
    >
      <div ref={leftRef} className="flex min-w-0 flex-col gap-1.5">
        <span
          className={cn(
            "truncate text-base font-semibold sm:text-lg",
            word.status === 'TO_COMPLETE' ? "text-amber-500" : ""
          )}
          style={word.status !== 'TO_COMPLETE' && primaryColor ? { color: primaryColor } : undefined}
        >
          {word.status === 'TO_COMPLETE' ? word.translation : word.term}
        </span>
        {word.status !== 'TO_COMPLETE' && (
          <span className="text-muted-foreground truncate text-xs sm:text-sm">
            {word.translation || 'À compléter'}
          </span>
        )}

        {ownerName && (
          <span
            className="truncate text-[11px] font-medium sm:text-xs"
            style={primaryColor ? { color: primaryColor } : undefined}
          >
            {ownerName}
          </span>
        )}
      </div>

      <div ref={rightRef} className="flex min-w-0 items-center gap-2">
        <WordTags
          tags={tags}
          rootRef={rootRef}
          leftRef={leftRef}
          rightRef={rightRef}
          buttonsRef={buttonsRef}
        />

        <div ref={buttonsRef} className="flex shrink-0 items-center gap-2">
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
    </div>
  );
};
