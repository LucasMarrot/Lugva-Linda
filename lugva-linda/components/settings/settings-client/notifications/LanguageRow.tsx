'use client';

import { Switch } from '@/components/ui';
import type { Language } from './types';

export function LanguageRow({
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
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}
