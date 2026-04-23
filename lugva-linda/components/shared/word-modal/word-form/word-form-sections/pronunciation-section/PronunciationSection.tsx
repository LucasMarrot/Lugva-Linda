'use client';

import { SectionHeader } from '@/components/shared';
import { AudioRecorder } from './AudioRecorder';

type PronunciationSectionProps = {
  existingAudioUrl?: string | null;
  errorMessage?: string | null;
  onValidationError?: (message: string | null) => void;
  onAudioReady: (file: File | null) => void;
};

export const PronunciationSection = ({
  existingAudioUrl,
  errorMessage,
  onValidationError,
  onAudioReady,
}: PronunciationSectionProps) => {
  return (
    <div className="space-y-3">
      <SectionHeader title="Prononciation" />
      <AudioRecorder
        existingAudioUrl={existingAudioUrl}
        onAudioReady={onAudioReady}
        errorMessage={errorMessage}
        onValidationError={onValidationError}
      />
      {errorMessage && (
        <p className="text-destructive text-sm font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
