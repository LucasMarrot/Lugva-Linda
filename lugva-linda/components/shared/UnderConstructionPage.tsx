import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UnderConstructionPageProps = {
  title: string;
  description?: string;
  backHref?: string;
};

const DEFAULT_DESCRIPTION =
  'Cette page est en cours de developpement. Elle sera disponible prochainement.';

export const UnderConstructionPage = ({
  title,
  description = DEFAULT_DESCRIPTION,
  backHref = '/',
}: UnderConstructionPageProps) => {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <section className="border-border bg-card w-full max-w-md rounded-2xl border p-6 text-center shadow-sm">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Construction className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {description}
        </p>

        <Button asChild className="mt-6 w-full" variant="outline">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour au dashboard
          </Link>
        </Button>
      </section>
    </main>
  );
};
