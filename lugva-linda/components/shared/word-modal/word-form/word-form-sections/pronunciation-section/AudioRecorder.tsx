'use client';

import { useCallback, useEffect, useState } from 'react';
import { AudioPlayer } from '@/components/shared';
import { useToast } from '@/components/providers/ToastProvider';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AddFile } from './AddFile';
import { Recorder } from './Recorder';

interface AudioRecorderProps {
  onAudioReady: (file: File | null) => void;
  existingAudioUrl?: string | null;
  errorMessage?: string | null;
  onValidationError?: (message: string | null) => void;
}

export const AudioRecorder = ({
  onAudioReady,
  existingAudioUrl,
  errorMessage,
  onValidationError,
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
      // Revoke object URLs when replacing/removing uploads to avoid memory leaks.
      setUploadedAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);

        return null;
      });

      if (notifyParent) {
        onAudioReady(null);
      }
    },
    [onAudioReady],
  );

  const handleStartRecording = async () => {
    if (hasUploadedAudio) {
      clearUploadedAudio(true);
    }
    onValidationError?.(null);
    await startRecording();
  };

  const handleFileReady = useCallback(
    (file: File) => {
      onValidationError?.(null);

      if (recordedAudioUrl) {
        deleteRecordedAudio();
      }

      if (hasUploadedAudio) {
        clearUploadedAudio(false);
      }

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

  const handleDelete = () => {
    if (hasUploadedAudio) {
      clearUploadedAudio(true);
      onValidationError?.(null);
      return;
    }

    deleteRecordedAudio();
    onValidationError?.(null);
  };

  useEffect(() => {
    if (errorEvent) {
      toast.error(errorEvent.message);
    }
  }, [errorEvent, toast]);

  useEffect(() => {
    return () => {
      if (uploadedAudioUrl) {
        URL.revokeObjectURL(uploadedAudioUrl);
      }
    };
  }, [uploadedAudioUrl]);

  return (
    <div className="space-y-2">
      {existingAudioUrl && (
        <AudioPlayer
          audioUrl={existingAudioUrl}
          label={
            activeAudioUrl ? 'Ancienne prononciation' : 'Prononciation actuelle'
          }
          tone={activeAudioUrl ? 'muted' : 'default'}
        />
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
          onDelete={handleDelete}
          label="Nouvelle prononciation"
        />
      )}
    </div>
  );
};
