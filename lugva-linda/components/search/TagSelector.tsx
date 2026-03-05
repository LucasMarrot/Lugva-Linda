import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const AVAILABLE_TAGS = ['Nom', 'Verbe', 'Adjectif', 'Adverbe', 'Expression']

type TagSelectorProps = {
  selectedTag: string | null
  onSelectTag: (tag: string) => void
}

export const TagSelector = ({ selectedTag, onSelectTag }: TagSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-foreground font-medium">Catégorie</Label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              selectedTag === tag
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50',
            )}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
