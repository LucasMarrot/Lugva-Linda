'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { SearchView } from './SearchView';
import { WordForm } from '../shared/word-modal/word-form/WordForm';
import {
  sanitizeReturnToPath,
  SEARCH_RETURN_TO_KEY,
} from './search-navigation';
import { PageHeader } from '../shared';

type SearchRoutePageProps = {
  initialQuery: string;
  currentLangId: string;
};

const ANIMATION_DURATION_MS = 220;

export const SearchRoutePage = ({
  initialQuery,
  currentLangId,
}: SearchRoutePageProps) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState(initialQuery);
  const [isCreating, setIsCreating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const getFallbackPath = () => {
    try {
      const storedPath = window.sessionStorage.getItem(SEARCH_RETURN_TO_KEY);
      return sanitizeReturnToPath(storedPath);
    } catch {
      return '/';
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const trimmedQuery = query.trim();

      if (trimmedQuery.length > 0) {
        url.searchParams.set('query', trimmedQuery);
      } else {
        url.searchParams.delete('query');
      }

      const nextPath = `${url.pathname}${url.search}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;

      if (nextPath !== currentPath) {
        window.history.replaceState(window.history.state, '', nextPath);
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const closeAndGoBack = () => {
    if (isClosing) return;

    setIsClosing(true);

    const navigate = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.replace(getFallbackPath());
    };

    if (shouldReduceMotion) {
      navigate();
      return;
    }

    window.setTimeout(navigate, ANIMATION_DURATION_MS);
  };

  const handleSuccess = () => {
    setQuery('');
    setIsCreating(false);
  };

  return (
    <motion.div
      className="bg-background fixed inset-0 z-40 flex min-h-dvh flex-col"
      initial={shouldReduceMotion ? { opacity: 1 } : { y: '100%' }}
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : isClosing
            ? { y: '100%' }
            : { y: 0 }
      }
      transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
    >
      <PageHeader
        title={
          !isCreating ? 'Rechercher ou ajouter' : "Ajouter à l'encyclopédie"
        }
        onCancel={!isCreating ? closeAndGoBack : () => setIsCreating(false)}
      />

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(var(--safe-area-bottom)+1rem)]">
        {!isCreating ? (
          <SearchView
            query={query}
            setQuery={setQuery}
            currentLangId={currentLangId}
            onCreateClick={() => setIsCreating(true)}
          />
        ) : (
          <WordForm
            initialQuery={query}
            currentLangId={currentLangId}
            onCancel={() => setIsCreating(false)}
            onSuccess={handleSuccess}
          />
        )}
      </main>
    </motion.div>
  );
};
