'use client';

import { SectionHeader } from '@/components/shared';
import { AudioRecorder } from './AudioRecorder';

type PronunciationSectionProps = {
  isEditing: boolean;
  hasExistingAudio: boolean;
  onAudioReady: (file: File | null) => void;
};

export const PronunciationSection = ({
  isEditing,
  hasExistingAudio,
  onAudioReady,
}: PronunciationSectionProps) => {
  return (
    <div className="space-y-3">
      <SectionHeader
        title={
          isEditing && hasExistingAudio
            ? "Nouvel audio (remplacera l'actuel)"
            : 'Prononciation'
        }
      />
      <AudioRecorder onAudioReady={onAudioReady} />
    </div>
  );
};
