'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Language } from '@prisma/client';
import { createLanguage } from '@/actions/language-actions';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { buildCreateLanguageFormSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';

type LanguageSelectorProps = {
  languages: Language[];
};

export const LanguageSelector = ({ languages }: LanguageSelectorProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [languageName, setLanguageName] = useState('');
  const [createLanguageError, setCreateLanguageError] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languageSchema = buildCreateLanguageFormSchema(
    languages.map((language) => language.name),
  );

  const languageValidation = languageSchema.safeParse({ name: languageName });
  const languageError = languageValidation.success
    ? null
    : (languageValidation.error.issues[0]?.message ??
      'Nom de langue invalide.');
  const isLanguageValid = languageValidation.success;

  const currentLangId =
    searchParams.get('lang') || (languages.length > 0 ? languages[0].id : '');

  const handleLanguageChange = (langId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', langId);
    router.push(`${pathname}?${params.toString()}`);
  };

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
      setLanguageName('');
      setIsDialogOpen(false);
    } catch (error) {
      const fallbackMessage = 'Impossible de creer la langue.';
      setCreateLanguageError(
        error instanceof Error ? error.message : fallbackMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);

    if (!open) {
      setLanguageName('');
      setCreateLanguageError(null);
      setIsSubmitting(false);
    }
  };

  return (
    <Select value={currentLangId} onValueChange={handleLanguageChange}>
      <SelectTrigger className="border-border bg-background h-9 w-[130px] focus:ring-0">
        <SelectValue placeholder="Langue" />
      </SelectTrigger>

      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            {lang.name}
          </SelectItem>
        ))}

        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/90 hover:bg-muted w-full justify-start px-2 font-medium"
            >
              + Nouvelle langue
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une langue</DialogTitle>
            </DialogHeader>
            <form action={handleCreateLanguage} className="space-y-4 pt-4">
              {(createLanguageError || languageError) && (
                <p className="text-destructive text-sm font-medium">
                  {createLanguageError ?? languageError}
                </p>
              )}
              <Input
                id="name"
                name="name"
                value={languageName}
                onChange={(event) => {
                  setLanguageName(event.target.value);
                  if (createLanguageError) {
                    setCreateLanguageError(null);
                  }
                }}
                placeholder="Nom de la langue (ex: Anglais)"
                required
                aria-invalid={!isLanguageValid || !!createLanguageError}
                className={cn(
                  (!isLanguageValid || createLanguageError) &&
                    'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!isLanguageValid || isSubmitting}
              >
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </SelectContent>
    </Select>
  );
};
