'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, Undo2 } from 'lucide-react';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { Button } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Recorder } from './word-modal/word-form/word-form-sections/pronunciation-section/Recorder';
import { AddFile } from './word-modal/word-form/word-form-sections/pronunciation-section/AddFile';

export interface AudioRecorderProps {
  onAudioReady: (file: File | null) => void;
  existingAudioUrl?: string | null;
  errorMessage?: string | null;
  onValidationError?: (message: string | null) => void;
  isExistingAudioRemoved?: boolean;
  onRemoveExistingAudio?: () => void;
  onRestoreExistingAudio?: () => void;
}

export const AudioRecorder = ({
  onAudioReady,
  existingAudioUrl,
  errorMessage,
  onValidationError,
  isExistingAudioRemoved,
  onRemoveExistingAudio,
  onRestoreExistingAudio,
}: AudioRecorderProps) => {
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  const handleRecordedAudioReady = useCallback(
    (file: File | null) => {
      onAudioReady(file);
    },
    [onAudioReady],
  );

  const {
    isRecording,
    audioUrl: recordedAudioUrl,
    errorEvent,
    startRecording,
    stopRecording,
    deleteAudio: deleteRecordedAudio,
  } = useAudioRecorder(handleRecordedAudioReady);

  const toast = useToast();

  const hasUploadedAudio = Boolean(uploadedAudioUrl);
  const activeAudioUrl = uploadedAudioUrl ?? recordedAudioUrl;

  const clearUploadedAudio = useCallback(
    (notifyParent: boolean) => {
      setUploadedAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      if (notifyParent) onAudioReady(null);
    },
    [onAudioReady],
  );

  const handleStartRecording = async () => {
    if (hasUploadedAudio) clearUploadedAudio(true);
    onValidationError?.(null);
    await startRecording();
  };

  const handleFileReady = useCallback(
    (file: File) => {
      onValidationError?.(null);
      if (recordedAudioUrl) deleteRecordedAudio();
      if (hasUploadedAudio) clearUploadedAudio(false);

      const nextUrl = URL.createObjectURL(file);
      setUploadedAudioUrl(nextUrl);
      onAudioReady(file);
    },
    [
      clearUploadedAudio,
      deleteRecordedAudio,
      onAudioReady,
      onValidationError,
      recordedAudioUrl,
      hasUploadedAudio,
    ],
  );

  const handleDeleteActive = () => {
    if (hasUploadedAudio) {
      clearUploadedAudio(true);
    } else {
      deleteRecordedAudio();
    }
    onValidationError?.(null);
  };

  useEffect(() => {
    if (errorEvent) toast.error(errorEvent.message);
  }, [errorEvent, toast]);

  useEffect(() => {
    return () => {
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    };
  }, [uploadedAudioUrl]);

  return (
    <div className="space-y-2">
      {existingAudioUrl && !isExistingAudioRemoved && (
        <AudioPlayer
          audioUrl={existingAudioUrl}
          label={
            activeAudioUrl ? 'Ancienne prononciation' : 'Prononciation actuelle'
          }
          tone={activeAudioUrl ? 'muted' : 'default'}
          onDelete={onRemoveExistingAudio}
        />
      )}

      {existingAudioUrl && isExistingAudioRemoved && (
        <div className="border-destructive/30 bg-destructive/10 animate-in fade-in flex items-center justify-between rounded-lg border p-3 duration-200">
          <span className="text-destructive flex items-center gap-2 text-sm font-medium">
            <Trash2 className="h-4 w-4" />
            Prononciation supprimée
          </span>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onRestoreExistingAudio}
            className="text-destructive hover:text-destructive hover:bg-destructive/20 h-8 px-2"
          >
            <Undo2 className="mr-1 h-4 w-4" />
            Annuler
          </Button>
        </div>
      )}

      {!activeAudioUrl ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Recorder
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={stopRecording}
            errorMessage={errorMessage}
          />
          <AddFile
            isDisabled={isRecording}
            onFileReady={handleFileReady}
            errorMessage={errorMessage}
            onValidationError={onValidationError}
          />
        </div>
      ) : (
        <AudioPlayer
          audioUrl={activeAudioUrl}
          onDelete={handleDeleteActive}
          label="Nouvelle prononciation"
        />
      )}
    </div>
  );
};
