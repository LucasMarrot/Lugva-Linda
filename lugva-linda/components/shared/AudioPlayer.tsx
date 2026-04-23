'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmButton } from './ConfirmButton';

export interface AudioPlayerProps {
  audioUrl: string;
  onDelete?: () => void;
  label?: string;
  tone?: 'default' | 'muted';
}

export const AudioPlayer = ({
  audioUrl,
  onDelete,
  label,
  tone = 'default',
}: AudioPlayerProps) => {
  const isMutedTone = tone === 'muted';

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border p-3',
        isMutedTone
          ? 'bg-destructive/2 border-destructive/15 border-dashed'
          : 'bg-muted/30 border-border/50',
      )}
    >
      {label && (
        <div className="flex h-7 w-full items-center justify-between gap-2">
          <div className="text-muted-foreground text-sm font-medium">
            {label}
          </div>

          {onDelete && (
            <ConfirmButton
              type="button"
              confirmVariant="destructive"
              idleVariant="ghostDestructive"
              size="icon"
              onConfirm={onDelete}
              aria-label="Supprimer cet audio"
              className="w-fit p-3"
              idleIcon={<Trash2 className="h-4 w-4" />}
            />
          )}
        </div>
      )}

      <audio
        controls
        src={audioUrl}
        playsInline
        preload="metadata"
        className="w-full"
      >
        Le navigateur ne supporte pas la lecture de ce format audio. Veuillez
        mettre a jour votre navigateur ou essayer un autre navigateur pour
        ecouter cet audio.
      </audio>
    </div>
  );
};
