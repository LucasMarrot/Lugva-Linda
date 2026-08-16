'use client';

import { Switch, Separator } from '@/components/ui';
import { LanguageRow } from './LanguageRow';
import type { Language } from './types';
import type { NotificationPreferences } from '@/types/notifications';

type LearnerPreferencesProps = {
  prefs: NotificationPreferences;
  languages: Language[];
  isSaving: boolean;
  updatePref: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
  toggleLanguageReminder: (languageId: string) => void;
  isLanguageEnabled: (languageId: string) => boolean;
};

export function LearnerPreferences({
  prefs,
  languages,
  isSaving,
  updatePref,
  toggleLanguageReminder,
  isLanguageEnabled,
}: LearnerPreferencesProps) {
  return (
    <>
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
            onCheckedChange={(val) => updatePref('sessionReminderEnabled', val)}
            disabled={isSaving}
          />
        </div>

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

      <Separator />

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
          onCheckedChange={(val) => updatePref('wordCompletedEnabled', val)}
          disabled={isSaving}
        />
      </div>
    </>
  );
}
