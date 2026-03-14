import Link from 'next/link';
import { FlaskConical, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SimulationModeBannerProps = {
  isVisible: boolean;
  isSimulationEnabled: boolean;
  onHref: string;
  offHref: string;
  hideHref: string;
};

export const SimulationModeBanner = ({
  isVisible,
  isSimulationEnabled,
  onHref,
  offHref,
  hideHref,
}: SimulationModeBannerProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-4">
      <div className="bg-muted/40 border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="text-muted-foreground h-4 w-4" />
          <div>
            <p className="text-sm font-medium">Mode simulation (dev)</p>
            <p className="text-muted-foreground text-xs">
              Actif par defaut en developpement. Aucune ecriture en base.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant={isSimulationEnabled ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={onHref}>Simulation ON</Link>
          </Button>

          <Button
            asChild
            variant={!isSimulationEnabled ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={offHref}>Simulation OFF</Link>
          </Button>

          <Button asChild variant="ghost" size="icon-sm">
            <Link href={hideHref} aria-label="Masquer le bandeau simulation">
              <X className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
