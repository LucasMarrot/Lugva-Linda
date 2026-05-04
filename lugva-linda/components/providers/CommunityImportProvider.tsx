'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { CommunityImportModal } from '@/components/shared/community-import/CommunityImportModal';

type CommunityImportContextValue = {
  addingWordId: string | null;
  importWord: (wordId: string, onSuccess?: () => void) => Promise<void>;
};

type PendingImportRequest = {
  wordId: string;
  onSuccess?: () => void;
};

const CommunityImportContext =
  createContext<CommunityImportContextValue | null>(null);

export const CommunityImportProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [addingWordId, setAddingWordId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] =
    useState<PendingImportRequest | null>(null);

  const importWord = async (wordId: string, onSuccess?: () => void) => {
    setPendingImport({ wordId, onSuccess });
  };

  const closeImportModal = () => {
    setPendingImport(null);
    setAddingWordId(null);
  };

  const handleImportSuccess = () => {
    pendingImport?.onSuccess?.();
    setPendingImport(null);
    setAddingWordId(null);
  };

  const value = useMemo<CommunityImportContextValue>(
    () => ({
      addingWordId,
      importWord,
    }),
    [addingWordId],
  );

  return (
    <CommunityImportContext.Provider value={value}>
      {children}
      <CommunityImportModal
        sourceWordId={pendingImport?.wordId ?? null}
        isOpen={pendingImport !== null}
        onClose={closeImportModal}
        onImportingChange={setAddingWordId}
        onImportSuccess={handleImportSuccess}
      />
    </CommunityImportContext.Provider>
  );
};

export const useCommunityImportContext = () => {
  const context = useContext(CommunityImportContext);

  if (!context) {
    throw new Error(
      'useCommunityImport must be used within a CommunityImportProvider.',
    );
  }

  return context;
};
