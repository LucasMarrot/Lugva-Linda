'use client'

type SynonymsListProps = {
  synonyms: string[]
  onSynonymClick: (synonym: string) => void
}

export const SynonymsList = ({
  synonyms,
  onSynonymClick,
}: SynonymsListProps) => {
  if (!synonyms || synonyms.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
        Synonymes
      </h3>
      <div className="flex flex-wrap gap-2">
        {synonyms.map((syn) => (
          <button
            key={syn}
            onClick={() => onSynonymClick(syn)}
            className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-colors active:scale-95"
          >
            {syn}
          </button>
        ))}
      </div>
    </div>
  )
}
