import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SearchResultItemProps = {
  word: {
    id: string
    word: string
    translation: string
    tags?: string[]
  }
}

export const SearchResultItem = ({ word }: SearchResultItemProps) => {
  return (
    <div className="border-border/50 bg-card hover:bg-accent/50 flex items-center justify-between rounded-xl border p-3 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">{word.word}</span>
          {word.tags && word.tags.length > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
              {word.tags[0]}
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-sm">
          {word.translation}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
      >
        <BookOpen className="text-primary h-4 w-4" />
      </Button>
    </div>
  )
}
