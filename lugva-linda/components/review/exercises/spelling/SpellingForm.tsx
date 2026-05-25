'use client';

import { Input, Button, Badge } from '@/components/ui';
import { Tag } from 'lucide-react';

type SpellingFormProps = {
  translation: string;
  mandatoryTag: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const SpellingForm = ({
  translation,
  mandatoryTag,
  inputValue,
  setInputValue,
  onSubmit,
}: SpellingFormProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-4 pt-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold">{translation}</h2>
        <Badge variant="outline" className="border-2 text-lg">
          <span className="flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" />
            {mandatoryTag}
          </span>
        </Badge>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col justify-end gap-3 pb-2"
      >
        <Input
          placeholder="Écrivez ici..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="bg-background text-foreground text-center text-lg shadow-inner"
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={!inputValue.trim()}>
          Vérifier la réponse
        </Button>
      </form>
    </div>
  );
};
