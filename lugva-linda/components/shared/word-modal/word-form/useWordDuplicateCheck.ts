'use client';

import { useEffect, useRef, useState } from 'react';
import { checkWordTermNatureAvailabilityAction } from '@/actions/word-actions';

type UseWordDuplicateCheckParams = {
  word: string;
  languageId: string;
  mandatoryTag: string | null;
  excludeWordId?: string;
};

export const useWordDuplicateCheck = ({
  word,
  languageId,
  mandatoryTag,
  excludeWordId,
}: UseWordDuplicateCheckParams) => {
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const latestDuplicateRequestRef = useRef(0);

  useEffect(() => {
    const trimmedWord = word.trim();

    if (!trimmedWord || !mandatoryTag || !languageId) {
      latestDuplicateRequestRef.current += 1;
      setDuplicateError(null);
      setIsCheckingDuplicate(false);
      return;
    }

    const requestId = latestDuplicateRequestRef.current + 1;
    latestDuplicateRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);

      try {
        const result = await checkWordTermNatureAvailabilityAction({
          word: trimmedWord,
          languageId,
          mandatoryTag,
          excludeWordId,
        });

        if (latestDuplicateRequestRef.current !== requestId) {
          return;
        }

        setDuplicateError(result.isDuplicate ? result.message : null);
      } catch {
        if (latestDuplicateRequestRef.current !== requestId) {
          return;
        }

        setDuplicateError(null);
      } finally {
        if (latestDuplicateRequestRef.current === requestId) {
          setIsCheckingDuplicate(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [word, languageId, mandatoryTag, excludeWordId]);

  return { isCheckingDuplicate, duplicateError };
};
