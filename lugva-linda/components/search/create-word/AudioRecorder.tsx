'use client';

import { useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { AudioPlayer } from '@/components/shared';
import { Button } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

type AudioRecorderProps = {
  onAudioReady: (file: File | null) => void;
  existingAudioUrl?: string | null;
};

export const AudioRecorder = ({
  onAudioReady,
  existingAudioUrl,
}: AudioRecorderProps) => {
  const {
    isRecording,
    audioUrl,
    errorEvent,
    startRecording,
    stopRecording,
    deleteAudio,
  } = useAudioRecorder(onAudioReady);
  const toast = useToast();

  const handleDelete = () => {
    deleteAudio();
  };

  useEffect(() => {
    if (errorEvent) {
      toast.error(errorEvent.message);
    }
  }, [errorEvent, toast]);

  return (
    <div className="space-y-2">
      {existingAudioUrl && (
        <AudioPlayer
          audioUrl={existingAudioUrl}
          label="Prononciation actuelle"
          tone={audioUrl ? 'muted' : 'default'}
        />
      )}

      {!audioUrl ? (
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'outline'}
          className="h-12 w-full gap-2 border-dashed transition-colors"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 fill-current" /> Arrêter
              l&apos;enregistrement
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" /> Enregistrer la prononciation
            </>
          )}
        </Button>
      ) : (
        <AudioPlayer
          audioUrl={audioUrl}
          onDelete={handleDelete}
          label="Nouvelle prononciation"
        />
      )}
    </div>
  );
};
