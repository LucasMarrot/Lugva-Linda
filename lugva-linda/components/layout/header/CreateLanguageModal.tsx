'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLanguage } from '@/actions/language-actions';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Input,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { buildCreateLanguageFormSchema } from '@/lib/validation/schemas';
import { PageHeader } from '../../shared';

type CreateLanguageModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingLanguageNames: string[];
};

const CreateLanguageModal = ({
  isOpen,
  onOpenChange,
  existingLanguageNames,
}: CreateLanguageModalProps) => {
  const router = useRouter();
  const [languageName, setLanguageName] = useState('');
  const [createLanguageError, setCreateLanguageError] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languageSchema = useMemo(
    () => buildCreateLanguageFormSchema(existingLanguageNames),
    [existingLanguageNames],
  );

  const languageValidation = useMemo(
    () => languageSchema.safeParse({ name: languageName }),
    [languageSchema, languageName],
  );
  const languageError = languageValidation.success
    ? null
    : (languageValidation.error.issues[0]?.message ??
      'Nom de langue invalide.');
  const isLanguageValid = languageValidation.success;

  const resetFormState = () => {
    setLanguageName('');
    setCreateLanguageError(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen]);

  const handleCreateLanguage = async (formData: FormData) => {
    const parsedForm = languageSchema.safeParse({
      name: String(formData.get('name') ?? '').trim(),
    });

    if (!parsedForm.success) {
      setCreateLanguageError(
        parsedForm.error.issues[0]?.message ??
          'Veuillez saisir un nom de langue valide.',
      );
      return;
    }

    const normalizedFormData = new FormData();
    normalizedFormData.set('name', parsedForm.data.name);

    try {
      setIsSubmitting(true);
      setCreateLanguageError(null);
      await createLanguage(normalizedFormData);
      resetFormState();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      const fallbackMessage = 'Impossible de creer la langue.';
      setCreateLanguageError(
        error instanceof Error ? error.message : fallbackMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetFormState();
    }

    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogTitle>Ajouter une langue</DialogTitle>
        <DialogDescription>
          Créez une nouvelle langue disponible pour votre espace.
        </DialogDescription>
        <div className="flex h-full flex-col">
          <PageHeader
            title="Créer une langue"
            onClose={() => onOpenChange(false)}
          />

          <form
            action={handleCreateLanguage}
            noValidate
            className="flex h-full flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <Input
                id="name"
                name="name"
                value={languageName}
                onChange={(event) => {
                  setLanguageName(event.target.value);
                  if (createLanguageError) setCreateLanguageError(null);
                }}
                placeholder="Nom de la langue (ex: English)"
                required
                aria-invalid={!isLanguageValid || !!createLanguageError}
                className={cn(
                  (!isLanguageValid || createLanguageError) &&
                    'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
                )}
              />
              {(createLanguageError || languageError) && (
                <p className="text-destructive mt-2 text-sm font-medium">
                  {createLanguageError ?? languageError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={!isLanguageValid || isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLanguageModal;
