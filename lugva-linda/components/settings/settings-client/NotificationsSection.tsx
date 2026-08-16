'use client';

import { useState, useTransition } from 'react';
import { Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { usePushNotifications } from '@/components/pwa/usePushNotifications';
import { updateNotificationPrefsAction } from '@/actions/push-actions';
import type { NotificationPreferences } from '@/types/notifications';
import type { Role } from '@prisma/client';
import type { Language } from './notifications/types';
import { PushSubscriptionBanner } from './notifications/PushSubscriptionBanner';
import { LearnerPreferences } from './notifications/LearnerPreferences';
import { ContributorPreferences } from './notifications/ContributorPreferences';

type NotificationsSectionProps = {
  role: Role;
  languages: Language[];
  initialPrefs: NotificationPreferences;
  initiallySubscribed: boolean;
};

export function NotificationsSection({
  role,
  languages,
  initialPrefs,
  initiallySubscribed,
}: NotificationsSectionProps) {
  const { isSupported, isSubscribed, isPending, subscribe, unsubscribe, error, permission } =
    usePushNotifications();

  const effectivelySubscribed = initiallySubscribed || isSubscribed;

  const [isSaving, startSaving] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);

  function updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    startSaving(async () => {
      try {
        await updateNotificationPrefsAction(newPrefs);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setPrefs(prefs);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  }

  function toggleLanguageReminder(languageId: string) {
    const current = prefs.sessionReminderLanguages;

    const expanded =
      current.length === 0
        ? languages.map((l) => l.id)
        : current;

    const updated = expanded.includes(languageId)
      ? expanded.filter((id) => id !== languageId)
      : [...expanded, languageId];

    const normalized =
      updated.length === languages.length ? [] : updated;

    updatePref('sessionReminderLanguages', normalized);
  }

  const isLanguageEnabled = (languageId: string) => {
    if (prefs.sessionReminderLanguages.length === 0) return true;
    return prefs.sessionReminderLanguages.includes(languageId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          {role === 'CONTRIBUTOR'
            ? 'Gérez les alertes pour les mots qui vous sont assignés.'
            : 'Gérez vos rappels de séances et les alertes de contribution.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <PushSubscriptionBanner
          isSupported={isSupported}
          effectivelySubscribed={effectivelySubscribed}
          isPending={isPending}
          permission={permission}
          error={error}
          subscribe={subscribe}
          unsubscribe={unsubscribe}
        />

        {effectivelySubscribed && (
          <div className="space-y-4">
            {/* Indicateur de sauvegarde */}
            {saveStatus === 'saved' && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Préférences enregistrées
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="text-destructive flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                Erreur lors de la sauvegarde
              </p>
            )}

            {role === 'USER' && (
              <LearnerPreferences
                prefs={prefs}
                languages={languages}
                isSaving={isSaving}
                updatePref={updatePref}
                toggleLanguageReminder={toggleLanguageReminder}
                isLanguageEnabled={isLanguageEnabled}
              />
            )}

            {role === 'CONTRIBUTOR' && (
              <ContributorPreferences
                prefs={prefs}
                isSaving={isSaving}
                updatePref={updatePref}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
