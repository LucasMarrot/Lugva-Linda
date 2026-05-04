'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type WordMutationContextValue = {
  mutationVersion: number;
  notifyWordMutation: () => void;
};

const WordMutationContext =
  createContext<WordMutationContextValue | null>(null);

export const WordMutationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [mutationVersion, setMutationVersion] = useState(0);

  const notifyWordMutation = () => {
    setMutationVersion((current) => current + 1);
  };

  const value = useMemo(
    () => ({ mutationVersion, notifyWordMutation }),
    [mutationVersion],
  );

  return (
    <WordMutationContext.Provider value={value}>
      {children}
    </WordMutationContext.Provider>
  );
};

export const useWordMutationContext = () => {
  const context = useContext(WordMutationContext);

  if (!context) {
    throw new Error(
      'useWordMutation must be used within a WordMutationProvider.',
    );
  }

  return context;
};
