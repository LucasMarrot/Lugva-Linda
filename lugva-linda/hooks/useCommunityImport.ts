'use client';

import { useCommunityImportContext } from '@/components/providers/CommunityImportProvider';

type UseCommunityImportReturn = {
  addingWordId: string | null;
  importWord: (wordId: string, onSuccess?: () => void) => Promise<void>;
};

export const useCommunityImport = (): UseCommunityImportReturn => {
  return useCommunityImportContext();
};
