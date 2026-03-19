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
      title="Erreur de session"
      description="La session de revision n'a pas pu etre preparee."
      onRetry={reset}
      backHref="/review"
    />
  );
}
