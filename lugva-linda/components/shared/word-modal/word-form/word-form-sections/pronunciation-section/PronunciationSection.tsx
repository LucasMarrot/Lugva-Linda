'use client';

import { AudioRecorder, SectionHeader } from '@/components/shared';

type PronunciationSectionProps = {
  existingAudioUrl?: string | null;
  errorMessage?: string | null;
  onValidationError?: (message: string | null) => void;
  onAudioReady: (file: File | null) => void;
  isExistingAudioRemoved?: boolean;
  onRemoveExistingAudio?: () => void;
  onRestoreExistingAudio?: () => void;
};

export const PronunciationSection = ({
  existingAudioUrl,
  errorMessage,
  onValidationError,
  onAudioReady,
  isExistingAudioRemoved,
  onRemoveExistingAudio,
  onRestoreExistingAudio,
}: PronunciationSectionProps) => {
  return (
    <div className="space-y-3">
      <SectionHeader title="Prononciation" />
      <AudioRecorder
        existingAudioUrl={existingAudioUrl}
        onAudioReady={onAudioReady}
        errorMessage={errorMessage}
        onValidationError={onValidationError}
        isExistingAudioRemoved={isExistingAudioRemoved}
        onRemoveExistingAudio={onRemoveExistingAudio}
        onRestoreExistingAudio={onRestoreExistingAudio}
      />
      {errorMessage && (
        <p className="text-destructive text-sm font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
