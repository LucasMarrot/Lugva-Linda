'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  buildRouteWithSearchParams,
  SEARCH_RETURN_TO_KEY,
} from '@/components/search/search-navigation';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const buildCurrentRoute = (
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
) => buildRouteWithSearchParams(pathname, searchParams.toString());

export const BottomNavSearchLink = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRoute = buildCurrentRoute(pathname, searchParams);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      className="bg-primary text-primary-foreground ring-background/50 hover:bg-primary/90 absolute -top-16 right-6 flex h-14 -translate-y-4 items-center overflow-hidden rounded-full shadow-lg ring-2 transition-colors active:scale-95"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Plus className="h-6 w-6" />
      </div>

      <AnimatePresence initial={false}>
        {!isScrolled && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="pr-5 font-semibold">Ajouter / Chercher</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
};
