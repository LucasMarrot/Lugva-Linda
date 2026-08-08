'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { SearchView } from './SearchView';
import { WordForm } from '../shared/word-modal/word-form/WordForm';
import { IncompleteWordForm } from './create-word/IncompleteWordForm';
import {
  sanitizeReturnToPath,
  SEARCH_RETURN_TO_KEY,
} from './search-navigation';
import { PageHeader } from '../shared';

type ContributorInfo = { id: string; name: string };

type SearchRoutePageProps = {
  initialQuery: string;
  currentLangId: string;
  isContributorMode?: boolean;
  contributors?: ContributorInfo[];
};

const ANIMATION_DURATION_MS = 220;

export const SearchRoutePage = ({
  initialQuery,
  currentLangId,
  isContributorMode = false,
  contributors = [],
}: SearchRoutePageProps) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState(initialQuery);
  const [isCreating, setIsCreating] = useState(false);
  const [isRequestingCompletion, setIsRequestingCompletion] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isInSubView = isCreating || isRequestingCompletion;

  const getFallbackPath = () => {
    try {
      const storedPath = window.sessionStorage.getItem(SEARCH_RETURN_TO_KEY);
      return sanitizeReturnToPath(storedPath);
    } catch {
      return '/';
    }
  };

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
    setIsRequestingCompletion(false);
  };

  const handleCancelSubView = () => {
    setIsCreating(false);
    setIsRequestingCompletion(false);
  };

  const getHeaderTitle = () => {
    if (isRequestingCompletion) return 'Demander une traduction';
    if (isCreating) return "Ajouter à l'encyclopédie";
    return 'Rechercher ou ajouter';
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
        title={getHeaderTitle()}
        onCancel={!isInSubView ? closeAndGoBack : handleCancelSubView}
      />

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(var(--safe-area-bottom)+1rem)]">
        {!isInSubView ? (
          <SearchView
            query={query}
            setQuery={setQuery}
            currentLangId={currentLangId}
            onCreateClick={() => setIsCreating(true)}
            onRequestCompletionClick={() => setIsRequestingCompletion(true)}
            hasContributor={contributors.length > 0}
            isContributorMode={isContributorMode}
          />
        ) : isRequestingCompletion ? (
          <IncompleteWordForm
            initialQuery={query}
            currentLangId={currentLangId}
            contributors={contributors}
            onCancel={handleCancelSubView}
            onSuccess={handleSuccess}
          />
        ) : (
          <WordForm
            initialQuery={query}
            currentLangId={currentLangId}
            onCancel={handleCancelSubView}
            onSuccess={handleSuccess}
            isContributorMode={isContributorMode}
          />
        )}
      </main>
    </motion.div>
  );
};
