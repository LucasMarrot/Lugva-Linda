import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import type { Language } from '@prisma/client';

interface HeaderProps {
  languages: Language[];
  title?: string;
}

export const Header = ({ languages, title }: HeaderProps) => {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur">
      <div className="z-10 flex items-center gap-2">
        <p className="text-xl font-bold tracking-tight">Lugva Linda</p>
      </div>

      {title && (
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-foreground pointer-events-none text-lg font-bold tracking-tight">
            {title}
          </h1>
        </div>
      )}

      <div className="z-10 flex items-center gap-2">
        <LanguageSelector languages={languages} />

        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
          </Link>
        </Button>
      </div>
    </header>
  );
};
