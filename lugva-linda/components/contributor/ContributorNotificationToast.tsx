'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { frenchPluralize } from '@/lib/utils';

type ContributorNotificationToastProps = {
  count: number;
  ownerName: string;
};

export const ContributorNotificationToast = ({
  count,
  ownerName,
}: ContributorNotificationToastProps) => {
  const toast = useToast();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (count > 0 && !hasShownRef.current) {
      hasShownRef.current = true;
      toast.warning(
        `${ownerName} a ajouté ${count} ${frenchPluralize(count, 'nouveau mot', 'nouveaux mots')} à compléter !`,
      );
    }
  }, [count, ownerName, toast]);

  return null;
};
