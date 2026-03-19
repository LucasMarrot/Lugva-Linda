'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createWord, updateWordAction } from '@/actions/word-actions';
import { SynonymSelector } from './SynonymSelector';
import { AudioRecorder } from './AudioRecorder';
import { TagSelector } from './TagSelector';
import { Word } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { createWordFormSchema } from '@/lib/validation/schemas';

type CreateWordViewProps = {
  initialQuery?: string;
  currentLangId?: string;
  initialData?: Word;
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

  const [selectedTag, setSelectedTag] = useState<string | null>(
    initialData?.tags?.[0] || null,
  );
  const [selectedSynonyms, setSelectedSynonyms] = useState<string[]>(
    initialData?.synonyms || [],
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }),
    [wordValue, translationValue],
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
      toast.error('La validation a echoue. Merci de reessayer.');
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
        {selectedTag && <input type="hidden" name="tags" value={selectedTag} />}
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
          <Label className="text-foreground font-medium">Catégorie</Label>
          <TagSelector
            selectedTag={selectedTag}
            onSelectTag={(tag) =>
              setSelectedTag((prev) => (prev === tag ? null : tag))
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
          disabled={!formValidation.success || isSubmitting}
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
