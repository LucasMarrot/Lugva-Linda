'use client';

import { useRef, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface AddFileProps {
  isDisabled: boolean;
  onFileReady: (file: File) => void;
  errorMessage?: string | null;
  onValidationError?: (message: string | null) => void;
}

const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/x-pn-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
  'audio/mp4a-latm',
]);

const ALLOWED_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'ogg', 'webm', 'aac']);

const AUDIO_ACCEPT_ATTRIBUTE =
  '.mp3,.m4a,.wav,.ogg,.webm,.aac,audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/aac';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const AddFile = ({
  isDisabled,
  onFileReady,
  errorMessage,
  onValidationError,
}: AddFileProps) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileExtension = (name: string) => {
    const segments = name.split('.');
    if (segments.length < 2) return '';

    return segments.at(-1)?.toLocaleLowerCase() ?? '';
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const fileType = file.type.toLocaleLowerCase();
    const fileExtension = getFileExtension(file.name);
    const hasAudioMime = fileType.startsWith('audio/');
    const hasAllowedMime = ALLOWED_MIME_TYPES.has(fileType);
    const hasAllowedExtension = ALLOWED_EXTENSIONS.has(fileExtension);

    if (!hasAudioMime && !hasAllowedExtension) {
      const message =
        'Veuillez selectionner un fichier audio valide. Formats acceptes: MP3, M4A, WAV, OGG, WEBM, AAC.';
      onValidationError?.(message);
      toast.error(message);
      resetInput();
      return;
    }

    if (!hasAllowedMime && !hasAllowedExtension) {
      const message =
        'Format audio non supporte. Formats acceptes: MP3, M4A, WAV, OGG, WEBM, AAC.';
      onValidationError?.(message);
      toast.error(message);
      resetInput();
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const message = 'Fichier audio trop volumineux. Taille maximale: 10 Mo.';
      onValidationError?.(message);
      toast.error(message);
      resetInput();
      return;
    }

    onValidationError?.(null);
    onFileReady(file);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'h-12 w-full gap-2 border-dashed transition-colors',
          errorMessage &&
            'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
        )}
        disabled={isDisabled}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Importer un fichier audio"
      >
        <Upload className="h-4 w-4" /> Ajouter un fichier audio
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={AUDIO_ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
