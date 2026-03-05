import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from './LanguageSelector'
import type { Language } from '@prisma/client'

interface HeaderProps {
  languages: Language[]
}

export const Header = ({ languages }: HeaderProps) => {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-10 flex items-center justify-between border-b p-4 backdrop-blur-md">
      <h1 className="text-xl font-bold tracking-tight">Lugva Linda</h1>

      <div className="flex items-center gap-2">
        <LanguageSelector languages={languages} />

        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
          </Link>
        </Button>
      </div>
    </header>
  )
}
