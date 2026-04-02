'use client';

import { useState } from 'react';
import { importWordFromCommunityAction } from '@/actions/word-actions';
import { parseActionErrorMessage } from '@/lib/actions/parse-action-error';
import { useToast } from '@/components/providers/ToastProvider';

type UseCommunityImportReturn = {
  addingWordId: string | null;
  importWord: (wordId: string, onSuccess?: () => void) => Promise<void>;
};

export const useCommunityImport = (): UseCommunityImportReturn => {
  const toast = useToast();
  const [addingWordId, setAddingWordId] = useState<string | null>(null);

  const importWord = async (wordId: string, onSuccess?: () => void) => {
    try {
      setAddingWordId(wordId);
      await importWordFromCommunityAction(wordId, {
        translation: true,
        tags: true,
        notes: false,
        synonyms: false,
        audio: false,
      });

      toast.success('Mot ajoute a votre encyclopedie.');
      onSuccess?.();
    } catch (error) {
      toast.error(parseActionErrorMessage(error));
    } finally {
      setAddingWordId(null);
    }
  };

  return {
    addingWordId,
    importWord,
  };
};
