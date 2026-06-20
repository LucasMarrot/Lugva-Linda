'use client';

import { Input } from '@/components/ui';
import { SectionHeader } from '@/components/shared';
import { cn } from '@/lib/utils';

type WordBasicsSectionProps = {
  wordValue: string;
  translationValue: string;
  wordError?: string;
  translationError?: string;
  isEditing: boolean;
  onWordChange: (value: string) => void;
  onTranslationChange: (value: string) => void;
};

export const WordBasicsSection = ({
  wordValue,
  translationValue,
  wordError,
  translationError,
  isEditing,
  onWordChange,
  onTranslationChange,
}: WordBasicsSectionProps) => {
  return (
    <div className="bg-muted/30 border-border/50 space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <SectionHeader title="Mot ou expression" />
        <Input
          id="word"
          name="word"
          value={wordValue}
          onChange={(event) => onWordChange(event.target.value)}
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
        <p className="text-muted-foreground mt-1 text-xs">
          Séparez les synonymes exacts par des virgules (ex: Perhaps, Maybe)
        </p>

        {wordError && (
          <p className="text-destructive text-sm font-medium">{wordError}</p>
        )}
      </div>

      <div className="space-y-2">
        <SectionHeader title="Traduction" />
        <Input
          id="translation"
          name="translation"
          value={translationValue}
          onChange={(event) => onTranslationChange(event.target.value)}
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
  );
};
