import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type BottomNavActionProps = {
  onClick?: () => void
}

export const BottomNavAction = ({ onClick }: BottomNavActionProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full shadow-lg ring-4',
        'bg-primary text-primary-foreground ring-background',
        'transition-transform active:scale-95',
      )}
      aria-label="Rechercher ou ajouter un mot"
    >
      <Search className="h-6 w-6" />
    </button>
  )
}
