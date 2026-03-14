'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { buildCreateLanguageFormSchema } from '@/lib/validation/schemas';

type SetupLanguageFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export const SetupLanguageForm = ({ action }: SetupLanguageFormProps) => {
  const [name, setName] = useState('');

  const schema = useMemo(() => buildCreateLanguageFormSchema([]), []);
  const validation = useMemo(() => schema.safeParse({ name }), [schema, name]);
  const errorMessage = validation.success
    ? null
    : (validation.error.issues[0]?.message ?? 'Nom de langue invalide.');

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de la langue (ex: Anglais)"
          aria-invalid={!!errorMessage}
          className={cn(
            errorMessage &&
              'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
          )}
          required
        />
        {errorMessage && (
          <p className="text-destructive text-sm font-medium">{errorMessage}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={!validation.success}>
        Commencer l&apos;apprentissage
      </Button>
    </form>
  );
};
