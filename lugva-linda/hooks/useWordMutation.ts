'use client';

import { useWordMutationContext } from '@/components/providers/WordMutationProvider';

type UseWordMutationReturn = {
  mutationVersion: number;
  notifyWordMutation: () => void;
};

export const useWordMutation = (): UseWordMutationReturn => {
  return useWordMutationContext();
};
