'use client';

import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createIncompleteWordAction } from '@/actions/word-actions';
import { useToast } from '@/components/providers/ToastProvider';
import {
  createIncompleteWordFormSchema,
  formalizeText,
} from '@/lib/validation/schemas';
import { MANDATORY_TAGS } from '@/lib/words/tags';
import { NatureSection } from '../../shared/word-modal/word-form/word-form-sections/nature-section/NatureSection';
import { SectionHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useWordDuplicateCheck } from '../../shared/word-modal/word-form/useWordDuplicateCheck';

type ContributorInfo = { id: string; name: string };

type IncompleteWordFormProps = {
  initialQuery?: string;
  currentLangId: string;
  contributors?: ContributorInfo[];
  /** @deprecated Not used internally — kept for callsite compatibility */
  onCancel?: () => void;
  onSuccess: () => void;
};

export const IncompleteWordForm = ({
  initialQuery = '',
  currentLangId,
  contributors = [],
  onSuccess,
}: IncompleteWordFormProps) => {
  const toast = useToast();

  const [selectedMandatoryTag, setSelectedMandatoryTag] = useState<
    string | null
  >(MANDATORY_TAGS[0] ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [translationValue, setTranslationValue] = useState(
    formalizeText(initialQuery) || initialQuery,
  );
  const [selectedContributorId, setSelectedContributorId] = useState<string>(
    contributors.length === 1 ? contributors[0].id : '',
  );

  const { isCheckingDuplicate, duplicateError } = useWordDuplicateCheck({
    word: translationValue,
    languageId: currentLangId,
    mandatoryTag: selectedMandatoryTag,
  });

  const formValidation = useMemo(
    () =>
      createIncompleteWordFormSchema.safeParse({
        translation: translationValue,
        mandatoryTag: selectedMandatoryTag ?? '',
      }),
    [translationValue, selectedMandatoryTag],
  );

  const validationIssues = formValidation.success
    ? []
    : formValidation.error.issues;
  const translationError = validationIssues.find(
    (issue) => issue.path[0] === 'translation',
  )?.message;
  const mandatoryTagError = validationIssues.find(
    (issue) => issue.path[0] === 'mandatoryTag',
  )?.message;

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      await createIncompleteWordAction(formData);
      toast.success('Mot envoyé au contributeur !');
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création du mot incomplet:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 fade-in space-y-6 pb-8 duration-200">
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="languageId" value={currentLangId} />
        {selectedMandatoryTag && (
          <input type="hidden" name="mandatoryTag" value={selectedMandatoryTag} />
        )}

        <div className="bg-muted/30 border-border/50 space-y-4 rounded-xl border p-4">
          <div className="space-y-2">
            <SectionHeader title="Contributeur associé" />
            <select
              name="contributorId"
              value={selectedContributorId}
              onChange={(e) => setSelectedContributorId(e.target.value)}
              disabled={contributors.length === 1}
              className={cn(
                'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              )}
              required
            >
              {contributors.length !== 1 && (
                <option value="" disabled>
                  Sélectionnez un contributeur
                </option>
              )}
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {contributors.length === 1 && (
              <input type="hidden" name="contributorId" value={contributors[0].id} />
            )}
          </div>

          <div className="space-y-2">
            <SectionHeader title="Traduction" />
            <Input
              id="translation"
              name="translation"
              value={translationValue}
              onChange={(event) => setTranslationValue(event.target.value)}
              aria-invalid={!!translationError}
              placeholder="Ex: Marcher, Bonjour..."
              className={cn(
                'bg-background h-11',
                translationError &&
                  'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
              )}
              required
              autoFocus
            />
            {translationError && (
              <p className="text-destructive text-sm font-medium">
                {translationError}
              </p>
            )}
          </div>
        </div>

        <NatureSection
          selectedMandatoryTag={selectedMandatoryTag}
          errorMessage={mandatoryTagError ?? duplicateError}
          onSelectTag={setSelectedMandatoryTag}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full text-base shadow-md"
          disabled={
            !formValidation.success ||
            isCheckingDuplicate ||
            Boolean(duplicateError)
          }
          isLoading={isSubmitting}
        >
          <Send className="mr-2 h-5 w-5" />
          Envoyer au contributeur
        </Button>
      </form>
    </div>
  );
};
