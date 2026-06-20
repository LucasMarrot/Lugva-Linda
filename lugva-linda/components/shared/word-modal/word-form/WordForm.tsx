'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { createWord, updateWordAction } from '@/actions/word-actions';
import { formatConcept, toUpperCaseFirstWord } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { createWordFormSchema } from '@/lib/validation/schemas';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { MANDATORY_TAGS } from '@/lib/words/tags';
import { WordBasicsSection } from './word-form-sections/WordBasicsSection';
import { NatureSection } from './word-form-sections/nature-section/NatureSection';
import { CustomTagsSection } from './word-form-sections/custom-tags-section/CustomTagsSection';
import { PronunciationSection } from './word-form-sections/pronunciation-section/PronunciationSection';
import { NotesSection } from './word-form-sections/NotesSection';
import { useWordDuplicateCheck } from './useWordDuplicateCheck';
import { RelatedWordsSection } from './word-form-sections/related-words-section/RelatedWordsSection';

const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
const AUDIO_ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
]);

const AUDIO_INVALID_TYPE_MESSAGE =
  'Format audio non supporté. Formats acceptés : MP3, M4A, WAV, OGG, WEBM, AAC.';
const AUDIO_TOO_LARGE_MESSAGE =
  'Fichier audio trop volumineux. Taille maximale: 10 Mo.';

const parseActionError = (rawMessage: string) => {
  const separatorIndex = rawMessage.indexOf(':');

  if (separatorIndex <= 0) {
    return {
      code: null as string | null,
      message: rawMessage.trim(),
    };
  }

  const maybeCode = rawMessage.slice(0, separatorIndex).trim();
  const maybeMessage = rawMessage.slice(separatorIndex + 1).trim();

  if (/^[A-Z0-9_]+$/.test(maybeCode)) {
    return {
      code: maybeCode,
      message: maybeMessage,
    };
  }

  return {
    code: null as string | null,
    message: rawMessage.trim(),
  };
};

const validateAudioFile = (file: File) => {
  const baseMimeType = file.type.split(';')[0].trim().toLowerCase();

  if (!AUDIO_ALLOWED_MIME_TYPES.has(baseMimeType)) {
    return AUDIO_INVALID_TYPE_MESSAGE;
  }

  if (file.size > AUDIO_MAX_BYTES) {
    return AUDIO_TOO_LARGE_MESSAGE;
  }

  return null;
};

type WordFormProps = {
  initialQuery?: string;
  currentLangId?: string;
  initialData?: EditableWordSnapshot;
  onCancel: () => void;
  onSuccess: () => void;
};

export const WordForm = ({
  initialQuery = '',
  currentLangId = '',
  initialData,
  onSuccess,
}: WordFormProps) => {
  const isEditing = !!initialData;
  const toast = useToast();

  const mandatoryTags =
    initialData?.tags?.filter((tag) =>
      MANDATORY_TAGS.includes(tag as (typeof MANDATORY_TAGS)[number]),
    ) || MANDATORY_TAGS.slice(0, 1);
  const customTags =
    initialData?.tags?.filter(
      (tag) => !MANDATORY_TAGS.includes(tag as (typeof MANDATORY_TAGS)[number]),
    ) || [];

  const [selectedMandatoryTag, setSelectedMandatoryTag] = useState<
    string | null
  >(mandatoryTags[0] ?? null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [shouldRemoveAudio, setShouldRemoveAudio] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(
    null,
  );
  const [hasNotesError, setHasNotesError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const langId = isEditing ? initialData.languageId : currentLangId;
  const defaultWord = isEditing
    ? formatConcept(initialData.term, initialData.synonyms, ', ')
    : toUpperCaseFirstWord(initialQuery);
  const defaultTranslation = initialData?.translation || '';
  const defaultNotesBlocks = initialData?.notesBlocks;
  const defaultRelatedWords = initialData?.relatedWords || [];

  const [wordValue, setWordValue] = useState(defaultWord);
  const [translationValue, setTranslationValue] = useState(defaultTranslation);

  const { isCheckingDuplicate, duplicateError } = useWordDuplicateCheck({
    word: wordValue,
    languageId: langId,
    mandatoryTag: selectedMandatoryTag,
    excludeWordId: isEditing ? initialData?.id : undefined,
  });

  const formValidation = useMemo(
    () =>
      createWordFormSchema.safeParse({
        word: wordValue,
        translation: translationValue,
        mandatoryTag: selectedMandatoryTag ?? '',
      }),
    [wordValue, translationValue, selectedMandatoryTag],
  );

  const validationIssues = formValidation.success
    ? []
    : formValidation.error.issues;
  const wordError = validationIssues.find(
    (issue) => issue.path[0] === 'word',
  )?.message;
  const translationError = validationIssues.find(
    (issue) => issue.path[0] === 'translation',
  )?.message;
  const mandatoryTagError = validationIssues.find(
    (issue) => issue.path[0] === 'mandatoryTag',
  )?.message;

  const handleAudioReady = (file: File | null) => {
    if (!file) {
      setAudioFile(null);
      if (pronunciationError) {
        setPronunciationError(null);
      }
      return;
    }

    const validationError = validateAudioFile(file);
    if (validationError) {
      setAudioFile(null);
      setPronunciationError(validationError);
      toast.error(validationError);
      return;
    }

    setAudioFile(file);
    if (pronunciationError) {
      setPronunciationError(null);
    }
  };

  const handlePronunciationValidation = (message: string | null) => {
    setPronunciationError(message);
  };

  const handleSubmit = async (formData: FormData) => {
    setPronunciationError(null);

    if (audioFile) {
      const validationError = validateAudioFile(audioFile);
      if (validationError) {
        setPronunciationError(validationError);
        toast.error(validationError);
        return;
      }

      formData.append('audioFile', audioFile);
    } else if (shouldRemoveAudio) {
      formData.append('removeAudio', 'true');
    }

    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateWordAction(initialData.id, formData);
        toast.success('Mot modifié avec succès.');
      } else {
        await createWord(formData);
        toast.success('Mot créé avec succès.');
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la validation du mot:', error);
      const rawMessage = error instanceof Error ? error.message : '';
      const { code, message } = parseActionError(rawMessage);
      const lowerRawMessage = rawMessage.toLowerCase();
      const isServerActionBodyLimitError =
        lowerRawMessage.includes('body exceeded') ||
        lowerRawMessage.includes('bodysizelimit');
      const resolvedMessage = message || 'Une erreur inattendue est survenue.';

      if (code === 'DUPLICATE') {
        toast.error(resolvedMessage || 'Ce mot existe deja avec cette nature.');
      } else if (
        code === 'INVALID_AUDIO_TYPE' ||
        code === 'AUDIO_TOO_LARGE' ||
        code === 'STORAGE_ERROR' ||
        (Boolean(audioFile) && isServerActionBodyLimitError)
      ) {
        const audioErrorMessage =
          code === 'INVALID_AUDIO_TYPE'
            ? AUDIO_INVALID_TYPE_MESSAGE
            : code === 'AUDIO_TOO_LARGE' || isServerActionBodyLimitError
              ? AUDIO_TOO_LARGE_MESSAGE
              : resolvedMessage;

        setPronunciationError(audioErrorMessage);
        toast.error(audioErrorMessage);
      } else {
        toast.error(resolvedMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 fade-in space-y-6 pb-8 duration-200">
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="languageId" value={langId} />
        {selectedMandatoryTag && (
          <input type="hidden" name="tags" value={selectedMandatoryTag} />
        )}

        <WordBasicsSection
          wordValue={wordValue}
          translationValue={translationValue}
          wordError={wordError}
          translationError={translationError}
          isEditing={isEditing}
          onWordChange={setWordValue}
          onTranslationChange={setTranslationValue}
        />

        <NatureSection
          selectedMandatoryTag={selectedMandatoryTag}
          errorMessage={mandatoryTagError ?? duplicateError}
          onSelectTag={setSelectedMandatoryTag}
        />

        <CustomTagsSection langId={langId} initialSelectedTags={customTags} />

        <PronunciationSection
          existingAudioUrl={initialData?.customAudioUrl}
          errorMessage={pronunciationError}
          onValidationError={handlePronunciationValidation}
          onAudioReady={handleAudioReady}
          isExistingAudioRemoved={shouldRemoveAudio}
          onRemoveExistingAudio={() => setShouldRemoveAudio(true)}
          onRestoreExistingAudio={() => setShouldRemoveAudio(false)}
        />

        <RelatedWordsSection
          currentLangId={langId}
          currentWord={wordValue}
          initialRelatedWords={defaultRelatedWords}
        />

        <NotesSection
          initialBlocks={defaultNotesBlocks}
          disabled={isSubmitting}
          onValidationChange={setHasNotesError}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full text-base shadow-md"
          disabled={
            !formValidation.success ||
            hasNotesError ||
            isSubmitting ||
            isCheckingDuplicate ||
            Boolean(duplicateError)
          }
        >
          {isSubmitting
            ? 'Enregistrement...'
            : isEditing
              ? 'Enregistrer les modifications'
              : 'Enregistrer la fiche'}
        </Button>
      </form>
    </div>
  );
};
