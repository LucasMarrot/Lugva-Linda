'use client';

import { useEffect } from 'react';

import { RouteErrorState } from '@/components/shared/RouteErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteErrorState
      title="Erreur de chargement"
      description="L'encyclopedie n'a pas pu etre chargee."
      onRetry={reset}
      backHref="/"
    />
  );
}
