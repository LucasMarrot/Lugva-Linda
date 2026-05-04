'use client';

import type { KeyboardEvent } from 'react';
import { SectionHeader } from '@/components/shared';
import {
  handleCardKeyToggle,
  panelCardClasses,
} from './CommunityImportPanelLayout';

type CommunityImportTranslationCardProps = {
  translation: string;
  isInteractive?: boolean;
  isActive?: boolean;
  onToggle?: () => void;
  ariaLabel?: string;
  showReplacement?: boolean;
  previousTranslation?: string;
  highlightTranslation?: boolean;
};

export const CommunityImportTranslationCard = ({
  translation,
  isInteractive = false,
  isActive = false,
  onToggle,
  ariaLabel,
  showReplacement = false,
  previousTranslation,
  highlightTranslation = false,
}: CommunityImportTranslationCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onToggle) {
      return;
    }

    handleCardKeyToggle(event, onToggle, !isInteractive);
  };

  return (
    <div
      className={`${panelCardClasses} ${isInteractive ? 'cursor-pointer transition-colors' : ''} ${isActive && isInteractive ? 'border-primary bg-primary/10' : ''}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? isActive : undefined}
      aria-label={isInteractive ? ariaLabel : undefined}
      onClick={isInteractive ? onToggle : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      <SectionHeader title="Traduction" variant="foreground" />

      {showReplacement && previousTranslation ? (
        <div className="flex gap-2">
          <p className="text-destructive mt-2 text-sm leading-relaxed line-through">
            {previousTranslation}
          </p>
          <p className="mt-2 text-sm leading-relaxed font-semibold text-emerald-600">
            {translation}
          </p>
        </div>
      ) : (
        <p
          className={`mt-2 text-sm leading-relaxed ${highlightTranslation ? 'text-emerald-600' : ''}`}
        >
          {translation}
        </p>
      )}
    </div>
  );
};
