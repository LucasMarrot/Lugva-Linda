'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  checkWordTermNatureAvailabilityAction,
  createWord,
  updateWordAction,
} from '@/actions/word-actions';
import { SynonymSelector } from './SynonymSelector';
import { AudioRecorder } from './AudioRecorder';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { createWordFormSchema } from '@/lib/validation/schemas';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { CustomTagSelector } from './CustomTagSelector';
import { MANDATORY_TAGS } from '@/lib/words/tags';
import { TagSelector } from './TagSelector';

type CreateWordViewProps = {
  initialQuery?: string;
  currentLangId?: string;
  initialData?: EditableWordSnapshot;
  onCancel: () => void;
  onSuccess: () => void;
};

export const CreateWordView = ({
  initialQuery = '',
  currentLangId = '',
  initialData,
  onCancel,
  onSuccess,
}: CreateWordViewProps) => {
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
  const [selectedCustomTags, setSelectedCustomTags] =
    useState<string[]>(customTags);

  const [selectedSynonyms, setSelectedSynonyms] = useState<string[]>(
    initialData?.synonyms || [],
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const latestDuplicateRequestRef = useRef(0);

  const langId = isEditing ? initialData.languageId : currentLangId;
  const defaultWord = isEditing ? initialData.term : initialQuery;
  const defaultTranslation = initialData?.translation || '';

  const [wordValue, setWordValue] = useState(defaultWord);
  const [translationValue, setTranslationValue] = useState(defaultTranslation);

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

  useEffect(() => {
    const trimmedWord = wordValue.trim();

    if (!trimmedWord || !selectedMandatoryTag || !langId) {
      latestDuplicateRequestRef.current += 1;
      setDuplicateError(null);
      setIsCheckingDuplicate(false);
      return;
    }

    const requestId = latestDuplicateRequestRef.current + 1;
    latestDuplicateRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);

      try {
        const result = await checkWordTermNatureAvailabilityAction({
          word: trimmedWord,
          languageId: langId,
          mandatoryTag: selectedMandatoryTag,
          excludeWordId: isEditing ? initialData?.id : undefined,
        });

        if (latestDuplicateRequestRef.current !== requestId) {
          return;
        }

        setDuplicateError(result.isDuplicate ? result.message : null);
      } catch {
        if (latestDuplicateRequestRef.current !== requestId) {
          return;
        }

        setDuplicateError(null);
      } finally {
        if (latestDuplicateRequestRef.current === requestId) {
          setIsCheckingDuplicate(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [wordValue, selectedMandatoryTag, langId, isEditing, initialData?.id]);

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
      <div className="mb-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="-ml-2"
        >
          <ArrowLeft className="text-foreground h-5 w-5" />
        </Button>
        <h3 className="text-foreground text-lg font-semibold">
          {isEditing ? 'Modifier la fiche' : "Ajouter à l'encyclopédie"}
        </h3>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="languageId" value={langId} />
        {selectedMandatoryTag && (
          <input type="hidden" name="tags" value={selectedMandatoryTag} />
        )}
        {selectedCustomTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
        {selectedSynonyms.map((syn) => (
          <input key={syn} type="hidden" name="synonyms" value={syn} />
        ))}

        <div className="bg-muted/30 border-border/50 space-y-4 rounded-xl border p-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-foreground font-medium">
              Mot ou expression
            </Label>
            <Input
              id="word"
              name="word"
              value={wordValue}
              onChange={(event) => setWordValue(event.target.value)}
              aria-invalid={!!wordError}
              placeholder="Ex: hello"
              className={cn(
                'bg-background h-11',
                wordError &&
                  'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
              )}
              required
              autoFocus={!isEditing}
            />
            {wordError && (
              <p className="text-destructive text-sm font-medium">
                {wordError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="translation"
              className="text-foreground font-medium"
            >
              Traduction
            </Label>
            <Input
              id="translation"
              name="translation"
              value={translationValue}
              onChange={(event) => setTranslationValue(event.target.value)}
              placeholder="Ex: Bonjour, Maison..."
              aria-invalid={!!translationError}
              className={cn(
                'bg-background h-11',
                translationError &&
                  'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
              )}
              required
            />
            {translationError && (
              <p className="text-destructive text-sm font-medium">
                {translationError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Nature</Label>
          <TagSelector
            selectedTag={selectedMandatoryTag}
            onSelectTag={setSelectedMandatoryTag}
          />
          {(mandatoryTagError || duplicateError) && (
            <p className="text-destructive text-sm font-medium">
              {mandatoryTagError ?? duplicateError}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Tags personnalisés
          </Label>
          <CustomTagSelector
            selectedCustomTags={selectedCustomTags}
            onAddCustomTag={(tag) =>
              setSelectedCustomTags((prev) => [...prev, tag])
            }
            onRemoveCustomTag={(tag) =>
              setSelectedCustomTags((prev) => prev.filter((t) => t !== tag))
            }
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            {isEditing && initialData?.customAudioUrl
              ? "Nouvel audio (remplacera l'actuel)"
              : 'Prononciation'}
          </Label>
          <AudioRecorder onAudioReady={setAudioFile} />
        </div>

        <SynonymSelector
          currentLangId={langId}
          currentWord={wordValue}
          selectedSynonyms={selectedSynonyms}
          setSelectedSynonyms={setSelectedSynonyms}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full text-base shadow-md"
          disabled={
            !formValidation.success ||
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
