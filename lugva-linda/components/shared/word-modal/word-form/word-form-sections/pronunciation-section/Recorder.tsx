'use client';

import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface RecorderProps {
  isRecording: boolean;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;
  errorMessage?: string | null;
}

export const Recorder = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  errorMessage,
}: RecorderProps) => {
  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      className={cn(
        'h-12 w-full gap-2 border-dashed transition-colors',
        errorMessage &&
          'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
      )}
      aria-label={
        isRecording
          ? "Arreter l'enregistrement audio"
          : 'Demarrer un enregistrement audio'
      }
      onClick={isRecording ? onStopRecording : onStartRecording}
    >
      {isRecording ? (
        <>
          <Square className="h-4 w-4 fill-current" /> Arreter
          l&apos;enregistrement
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" /> Enregistrer la prononciation
        </>
      )}
    </Button>
  );
};
