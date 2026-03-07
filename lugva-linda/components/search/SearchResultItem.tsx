import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWordModal } from '../providers/WordModalProvider'
import { useRouter } from 'next/navigation'
import { Word } from '@prisma/client'

type SearchResultItemProps = {
  word: Word
}

export const SearchResultItem = ({ word }: SearchResultItemProps) => {
  const router = useRouter()
  const { openWord } = useWordModal()

  const handleGoToEncyclopedia = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/words?lang=${word.id}#word-${word.id}`)
  }

  return (
    <div
      onClick={() => openWord(word)}
      className="border-border/50 bg-card hover:bg-accent/50 flex items-center justify-between rounded-xl border p-3 transition-colors"
    >
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
        onClick={handleGoToEncyclopedia}
      >
        <BookOpen className="text-primary h-4 w-4" />
      </Button>
    </div>
  )
}
