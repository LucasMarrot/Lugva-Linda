'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SearchView } from './SearchView';
import { CreateWordView } from './CreateWordView';

export const SearchDrawer = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState('');

  const searchParams = useSearchParams();
  const currentLangId = searchParams.get('lang') || '';

  const handleSuccess = () => {
    setQuery('');
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setQuery('');
        setIsCreating(false);
      }, 300);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="bg-background pb-[var(--safe-area-bottom)]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>
            {isCreating ? 'Ajouter un mot' : 'Rechercher ou ajouter'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex h-full flex-col overflow-y-auto p-4">
          {!isCreating ? (
            <SearchView
              query={query}
              setQuery={setQuery}
              currentLangId={currentLangId}
              onCreateClick={() => setIsCreating(true)}
            />
          ) : (
            <CreateWordView
              initialQuery={query}
              currentLangId={currentLangId}
              onCancel={() => setIsCreating(false)}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
