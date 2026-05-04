'use client';

import { useEffect, useRef, useState } from 'react';
import { previewWordImportAction } from '@/actions/word-actions';
import { parseActionErrorMessage } from '@/lib/actions/parse-action-error';

export type PreviewPayload = Awaited<
  ReturnType<typeof previewWordImportAction>
>;

type UseCommunityImportPreviewArgs = {
  isOpen: boolean;
  sourceWordId: string | null;
};

type UseCommunityImportPreviewResult = {
  preview: PreviewPayload | null;
  isLoadingPreview: boolean;
  previewError: string | null;
  resetPreview: () => void;
};

export const useCommunityImportPreview = ({
  isOpen,
  sourceWordId,
}: UseCommunityImportPreviewArgs): UseCommunityImportPreviewResult => {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !sourceWordId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);

      try {
        const result = await previewWordImportAction(sourceWordId, {
          translation: true,
          tags: true,
          notes: true,
          synonyms: false,
          audio: true,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setPreview(result);
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const message = parseActionErrorMessage(error);
        setPreview(null);
        setPreviewError(message);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoadingPreview(false);
        }
      }
    };

    void loadPreview();
  }, [isOpen, sourceWordId]);

  const resetPreview = () => {
    setPreview(null);
    setPreviewError(null);
  };

  return {
    preview,
    isLoadingPreview,
    previewError,
    resetPreview,
  };
};
