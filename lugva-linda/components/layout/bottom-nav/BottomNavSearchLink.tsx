'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildRouteWithSearchParams,
  SEARCH_RETURN_TO_KEY,
} from '@/components/search/search-navigation';
import { toast } from 'sonner';

const buildCurrentRoute = (
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
) => buildRouteWithSearchParams(pathname, searchParams.toString());

export const BottomNavSearchLink = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRoute = buildCurrentRoute(pathname, searchParams);

  const handleClick = () => {
    try {
      window.sessionStorage.setItem(SEARCH_RETURN_TO_KEY, currentRoute);
    } catch {
      toast.warning(
        "Impossible de sauvegarder la page actuelle pour la recherche. Vous serez redirigé vers l'accueil après la recherche.",
      );
    }
  };

  return (
    <Link
      href="/search"
      scroll={false}
      onClick={handleClick}
      aria-label="Rechercher ou ajouter un mot"
      className={cn(
        'ui-motion-interactive ui-tap-feedback flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full shadow-lg ring-4',
        'bg-primary text-primary-foreground ring-background',
      )}
    >
      <Search className="h-6 w-6" />
    </Link>
  );
};
