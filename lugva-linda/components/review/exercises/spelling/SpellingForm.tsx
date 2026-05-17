'use client';

import { Input, Button } from '@/components/ui';

type SpellingFormProps = {
  translation: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const SpellingForm = ({
  translation,
  inputValue,
  setInputValue,
  onSubmit,
}: SpellingFormProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-4 pt-10 text-center">
      <h2 className="text-3xl font-bold">{translation}</h2>

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
