import { Word } from '@prisma/client'

type WordListItemProps = {
  word: Word
  onClick: () => void
}

export const WordListItem = ({ word, onClick }: WordListItemProps) => {
  return (
    <button
      id={`word-${word.id}`}
      onClick={onClick}
      className="border-border/50 bg-card hover:bg-accent/50 flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border p-4 text-left transition-colors active:scale-[0.98]"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-foreground truncate text-lg font-semibold">
          {word.word}
        </span>
        <span className="text-muted-foreground truncate text-sm">
          {word.translation}
        </span>
      </div>
      {word.tags && word.tags.length > 0 && (
        <span className="bg-primary/10 text-primary inline-flex h-6 shrink-0 items-center justify-center rounded-full px-3 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase sm:text-xs">
          {word.tags[0]}
        </span>
      )}
    </button>
  )
}
