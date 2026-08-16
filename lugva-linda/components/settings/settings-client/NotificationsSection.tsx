'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

type Language = { id: string; name: string };

type NotificationsSectionProps = {
  role: Role;
  languages: Language[];
  initialPrefs: NotificationPreferences;
  initiallySubscribed: boolean;
};

function Switch({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

function LanguageRow({
  language,
  enabled,
  onToggle,
  disabled,
}: {
  language: Language;
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <label
        htmlFor={`lang-reminder-${language.id}`}
        className="text-sm font-medium cursor-pointer select-none"
      >
        {language.name}
      </label>
      <Switch
        id={`lang-reminder-${language.id}`}
        checked={enabled}
        onChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

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

  // Optimistic prefs state
  const [prefs, setPrefsOptimistic] = useOptimistic<NotificationPreferences>(initialPrefs);

  function updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) {
    const newPrefs = { ...prefs, [key]: value };

    startSaving(async () => {
      setPrefsOptimistic(newPrefs);
      try {
        await updateNotificationPrefsAction(newPrefs);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  }

  function toggleLanguageReminder(languageId: string) {
    const current = prefs.sessionReminderLanguages;
    const updated = current.includes(languageId)
      ? current.filter((id) => id !== languageId)
      : [...current, languageId];
    updatePref('sessionReminderLanguages', updated);
  }

  const isLanguageEnabled = (languageId: string) => {
    // Liste vide = toutes actives
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
        <div className="border-border bg-muted/30 flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              {effectivelySubscribed
                ? 'Notifications activées'
                : 'Activer les notifications push'}
            </p>
            <p className="text-muted-foreground text-xs">
              {!isSupported
                ? "Non supporté — installez l'application sur votre écran d'accueil (iOS)."
                : permission === 'denied'
                  ? 'Permission refusée. Modifiez les réglages de votre navigateur.'
                  : effectivelySubscribed
                    ? 'Cet appareil recevra les notifications configurées ci-dessous.'
                    : 'Autorisez les notifications pour recevoir les rappels et alertes.'}
            </p>
            {error && (
              <p className="text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {isPending ? (
            <Loader2 className="text-muted-foreground mt-0.5 h-5 w-5 animate-spin shrink-0" />
          ) : effectivelySubscribed ? (
            <button
              onClick={unsubscribe}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-xs transition-colors"
            >
              <BellOff className="h-4 w-4" />
              Désactiver
            </button>
          ) : (
            <button
              onClick={subscribe}
              disabled={!isSupported || isPending || permission === 'denied'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              Activer
            </button>
          )}
        </div>

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
              <>
                {/* Rappels de séances */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Rappels de séances</p>
                      <p className="text-muted-foreground text-xs">
                        Recevez un rappel les jours où vous avez des exercices à faire.
                      </p>
                    </div>
                    <Switch
                      id="session-reminder-global"
                      checked={prefs.sessionReminderEnabled}
                      onChange={(val) => updatePref('sessionReminderEnabled', val)}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Sélecteur par langue */}
                  {prefs.sessionReminderEnabled && languages.length > 0 && (
                    <div className="border-border bg-muted/20 divide-border ml-2 divide-y rounded-lg border px-4">
                      {languages.map((lang) => (
                        <LanguageRow
                          key={lang.id}
                          language={lang}
                          enabled={isLanguageEnabled(lang.id)}
                          onToggle={() => toggleLanguageReminder(lang.id)}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-border border-t" />

                {/* Mots complétés */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Mots complétés</p>
                    <p className="text-muted-foreground text-xs">
                      Soyez notifié quand votre contributeur complète un mot soumis.
                    </p>
                  </div>
                  <Switch
                    id="word-completed-toggle"
                    checked={prefs.wordCompletedEnabled}
                    onChange={(val) => updatePref('wordCompletedEnabled', val)}
                    disabled={isSaving}
                  />
                </div>
              </>
            )}

            {role === 'CONTRIBUTOR' && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Mots à compléter</p>
                  <p className="text-muted-foreground text-xs">
                    Soyez notifié quand un apprenant vous soumet un nouveau mot à enrichir.
                  </p>
                </div>
                <Switch
                  id="word-assigned-toggle"
                  checked={prefs.wordAssignedEnabled}
                  onChange={(val) => updatePref('wordAssignedEnabled', val)}
                  disabled={isSaving}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
