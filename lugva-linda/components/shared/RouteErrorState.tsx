'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type RouteErrorStateProps = {
  title?: string;
  description?: string;
  backHref?: string;
  onRetry?: () => void;
};

const DEFAULT_TITLE = 'Une erreur est survenue';
const DEFAULT_DESCRIPTION =
  "La page n'a pas pu etre chargee correctement. Vous pouvez reessayer.";

export const RouteErrorState = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  backHref = '/',
  onRetry,
}: RouteErrorStateProps) => {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <section className="border-border bg-card w-full max-w-md rounded-2xl border p-6 text-center shadow-sm">
        <div className="bg-destructive/10 text-destructive mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onRetry}
            disabled={!onRetry}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reessayer
          </Button>
          <Button asChild className="flex-1">
            <Link href={backHref}>Retour</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};
