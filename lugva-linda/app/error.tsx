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
      description="Le dashboard n'a pas pu etre charge."
      onRetry={reset}
      backHref="/"
    />
  );
}
