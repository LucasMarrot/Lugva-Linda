'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { createWord, updateWordAction } from '@/actions/word-actions';
import { toUpperCaseFirstWord } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { createWordFormSchema } from '@/lib/validation/schemas';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { MANDATORY_TAGS } from '@/lib/words/tags';
import { WordBasicsSection } from './word-form-sections/WordBasicsSection';
import { NatureSection } from './word-form-sections/nature-section/NatureSection';
import { CustomTagsSection } from './word-form-sections/custom-tags-section/CustomTagsSection';
import { PronunciationSection } from './word-form-sections/pronunciation-section/PronunciationSection';
import { SynonymsSection } from './word-form-sections/synonym-section/SynonymsSection';
import { NotesSection } from './word-form-sections/NotesSection';
import { useWordDuplicateCheck } from './useWordDuplicateCheck';

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
  const [hasNotesError, setHasNotesError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const langId = isEditing ? initialData.languageId : currentLangId;
  const defaultWord = isEditing
    ? initialData.term
    : toUpperCaseFirstWord(initialQuery);
  const defaultTranslation = initialData?.translation || '';
  const defaultNotesBlocks = initialData?.notesBlocks;
  const defaultSynonyms = initialData?.synonyms || [];

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

  const handleSubmit = async (formData: FormData) => {
    if (audioFile) {
      formData.append('audioFile', audioFile);
    }

    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateWordAction(initialData.id, formData);
        toast.success('Mot modifie avec succes.');
      } else {
        await createWord(formData);
        toast.success('Mot cree avec succes.');
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la validation du mot:', error);
      const rawMessage = error instanceof Error ? error.message : '';
      const [code, ...rest] = rawMessage.split(':');
      const message = rest.join(':').trim();

      if (code === 'DUPLICATE') {
        toast.error(message || 'Ce mot existe deja avec cette nature.');
      } else {
        toast.error('La validation a echoue. Merci de reessayer.');
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
          isEditing={isEditing}
          hasExistingAudio={Boolean(initialData?.customAudioUrl)}
          onAudioReady={setAudioFile}
        />

        <SynonymsSection
          currentLangId={langId}
          currentWord={wordValue}
          initialSynonyms={defaultSynonyms}
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
