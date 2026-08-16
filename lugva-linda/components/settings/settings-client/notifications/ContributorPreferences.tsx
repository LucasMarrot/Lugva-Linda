'use client';

import { Switch } from '@/components/ui';
import type { NotificationPreferences } from '@/types/notifications';

type ContributorPreferencesProps = {
  prefs: NotificationPreferences;
  isSaving: boolean;
  updatePref: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
};

export function ContributorPreferences({
  prefs,
  isSaving,
  updatePref,
}: ContributorPreferencesProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">Mots à compléter</p>
        <p className="text-muted-foreground text-xs">
          Soyez notifié quand un utilisateur vous soumet un nouveau mot à compléter.
        </p>
      </div>
      <Switch
        id="word-assigned-toggle"
        checked={prefs.wordAssignedEnabled}
        onCheckedChange={(val) => updatePref('wordAssignedEnabled', val)}
        disabled={isSaving}
      />
    </div>
  );
}
