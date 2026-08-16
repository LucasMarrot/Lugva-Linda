'use client';

import { useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import { Switch, Separator } from '@/components/ui';
import { updateNotificationPrefsAction } from '@/actions/push-actions';
import { usePushNotifications } from '@/components/pwa/usePushNotifications';

type ContributorNotificationToggleProps = {
  initialWordAssignedEnabled: boolean;
};

export const ContributorNotificationToggle = ({
  initialWordAssignedEnabled,
}: ContributorNotificationToggleProps) => {
  const [wordAssignedEnabled, setWordAssignedEnabled] = useState(initialWordAssignedEnabled);
  const [, startSaving] = useTransition();

  const { isSubscribed, subscribe, isPending, error } = usePushNotifications();

  function toggleWordAssigned() {
    const newVal = !wordAssignedEnabled;
    setWordAssignedEnabled(newVal);

    startSaving(async () => {
      try {
        if (newVal && !isSubscribed) {
          await subscribe();
        }
        await updateNotificationPrefsAction({ wordAssignedEnabled: newVal });
      } catch {
        setWordAssignedEnabled(!newVal);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-sm">Mots à compléter</span>
          </div>
          <Switch
            checked={wordAssignedEnabled}
            onCheckedChange={toggleWordAssigned}
            disabled={isPending}
          />
        </div>
        {error && (
          <span className="text-destructive text-xs leading-tight">
            {error}
          </span>
        )}
      </div>
      <Separator />
    </>
  );
};
