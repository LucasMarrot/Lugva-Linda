import { Loader2 } from 'lucide-react';

type PageLoadingStateProps = {
  title?: string;
  description?: string;
};

const DEFAULT_TITLE = 'Chargement...';
const DEFAULT_DESCRIPTION = 'Preparation de la page en cours.';

export const PageLoadingState = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: PageLoadingStateProps) => {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <section className="border-border bg-card w-full max-w-md rounded-2xl border p-6 text-center shadow-sm">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>

        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {title}
        </h2>

        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {description}
        </p>
      </section>
    </main>
  );
};
