import { cn } from '@/lib/utils'

type TagFilterProps = {
  allTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
}

export const TagFilter = ({
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: TagFilterProps) => {
  if (allTags.length === 0) return null

  return (
    <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto px-4 pb-2">
      <button
        onClick={onClearTags}
        className={cn(
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          selectedTags.length === 0
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        Tous
      </button>

      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors sm:text-xs',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary hover:bg-primary/20',
            )}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
