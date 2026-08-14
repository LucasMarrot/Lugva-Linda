'use client';

import { useState, useEffect } from 'react';
import { Tag, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Badge,
  Button,
  Input,
} from '@/components/ui';
import { PageHeader, SectionHeader } from '@/components/shared/';
import { PronunciationSection } from '@/components/shared/word-modal/word-form/word-form-sections/pronunciation-section/PronunciationSection';
import { useToast } from '@/components/providers/ToastProvider';
import { completeWordAction } from '@/actions/word-actions';
import { type EditableWordSnapshot } from '@/lib/words/community';
import { cn } from '@/lib/utils';
import { nonEmptyTextSchema } from '@/lib/validation/schemas';

type WordCompleteModalProps = {
  isOpen: boolean;
  word: EditableWordSnapshot | null;
  onClose: () => void;
};

export const WordCompleteModal = ({
  isOpen,
  word,
  onClose,
}: WordCompleteModalProps) => {
  const toast = useToast();
  const [termValue, setTermValue] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTermValue('');
      setAudioFile(null);
      setAudioError(null);
    }
  }, [isOpen]);

  const termValidation = nonEmptyTextSchema.safeParse(termValue);
  const isValid = termValidation.success;

  const handleSubmit = async () => {
    if (!word || !isValid) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('term', termValue.trim());
      if (audioFile) {
        formData.append('audioFile', audioFile);
      }

      await completeWordAction(word.id, formData);
      toast.success(`"${termValue}" complété !`);

      setTermValue('');
      setAudioFile(null);
      setAudioError(null);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTermValue('');
      setAudioFile(null);
      setAudioError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent fullScreen>
        <DialogTitle>
          {word ? `Compléter "${word.translation}"` : 'Compléter un mot'}
        </DialogTitle>
        <DialogDescription>
          Ajoutez le mot et la prononciation pour compléter cette traduction.
        </DialogDescription>

        {word && (
          <div className="flex h-full flex-col">
            <PageHeader title="Compléter la fiche" onClose={onClose} />

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
              <div className="space-y-2 text-center">
                <h2 className="text-primary text-4xl font-extrabold">
                  {word.translation}
                </h2>

                {word.tags && word.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {word.tags.map((tag, index) => (
                      <Badge
                        key={tag + String(index)}
                        variant={
                          index === 0 ? 'secondaryOutline' : 'outline'
                        }
                        className="p-2 px-4 text-sm"
                      >
                        <span className="flex items-center justify-center gap-2">
                          {index === 0 && <Tag className="h-4 w-4" />}
                          {tag}
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/30 border-border/50 space-y-4 rounded-xl border p-4">
                <div className="space-y-2">
                  <SectionHeader title="Mot ou expression" />
                  <Input
                    id="term"
                    value={termValue}
                    onChange={(e) => setTermValue(e.target.value)}
                    placeholder="Entrez le mot..."
                    className={cn(
                      'bg-background h-11',
                      !isValid &&
                        termValue.length > 0 &&
                        'border-destructive',
                    )}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <PronunciationSection
                errorMessage={audioError}
                onValidationError={setAudioError}
                onAudioReady={setAudioFile}
              />
            </div>

            <div className="border-border bg-background border-t p-4 pb-[calc(var(--safe-area-bottom)+1rem)]">
              <Button
                size="lg"
                className="h-14 w-full text-base shadow-md"
                disabled={!isValid}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                <Check className="mr-2 h-5 w-5" />
                Valider
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
