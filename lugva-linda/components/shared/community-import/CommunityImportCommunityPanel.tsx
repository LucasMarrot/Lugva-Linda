'use client';

import type { KeyboardEvent, MouseEvent, RefObject } from 'react';
import { AudioPlayer, SectionHeader } from '@/components/shared';
import type { PreviewPayload } from './useCommunityImportPreview';
import type { CommunityImportSelectionState } from './useCommunityImportSelection';
import {
  CommunityImportPanelHeader,
  CommunityImportPanelSection,
  CommunityImportPanelShell,
  CommunityImportTagList,
  handleCardKeyToggle,
  panelCardClasses,
} from './CommunityImportPanelLayout';
import { CommunityImportNotesSection } from './CommunityImportNotesSection';
import { CommunityImportTranslationCard } from './CommunityImportTranslationCard';

type CommunityImportCommunityPanelProps = {
  preview: PreviewPayload;
  selection: CommunityImportSelectionState;
  communityNotesContainerRef: RefObject<HTMLDivElement | null>;
  onCommunityNotesClick: (event: MouseEvent<HTMLDivElement>) => void;
  onCommunityNotesKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onToggleCommunityTranslation: () => void;
  onToggleCommunityAudio: () => void;
};

export const CommunityImportCommunityPanel = ({
  preview,
  selection,
  communityNotesContainerRef,
  onCommunityNotesClick,
  onCommunityNotesKeyDown,
  onToggleCommunityTranslation,
  onToggleCommunityAudio,
}: CommunityImportCommunityPanelProps) => {
  const {
    mandatoryTag,
    sourceTranslation,
    canSelectCommunityTranslation,
    communityTranslationActive,
    communityCustomTags,
    selectedCommunityTagKeySet,
    showCommunityAudio,
    communityAudioActive,
    sourceAudioUrl,
    communityNoteBlocks,
    toggleCommunityTag,
  } = selection;

  return (
    <CommunityImportPanelShell
      header={
        <CommunityImportPanelHeader
          label={`Version de ${preview.sourceWord.owner.displayName || 'la communauté'}`}
          term={preview.sourceWord.term}
          mandatoryTag={mandatoryTag}
        />
      }
    >
      {sourceTranslation && (
        <CommunityImportTranslationCard
          translation={sourceTranslation}
          isInteractive={canSelectCommunityTranslation}
          isActive={communityTranslationActive}
          onToggle={onToggleCommunityTranslation}
          ariaLabel="Selectionner ou deselectionner la traduction communautaire"
        />
      )}

      {communityCustomTags.length > 0 && (
        <CommunityImportPanelSection title="Tags personnalisés">
          <CommunityImportTagList>
            {communityCustomTags.map((tag) => {
              const isSelected = selectedCommunityTagKeySet.has(tag.key);

              return (
                <button
                  type="button"
                  key={`community-${tag.key}`}
                  className={`${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'text-foreground bg-muted/20'} inline-flex min-w-0 cursor-pointer items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors`}
                  onClick={() => toggleCommunityTag(tag.key)}
                  aria-pressed={isSelected}
                  aria-label={`Selection du tag ${tag.value}`}
                >
                  <span className="truncate">{tag.value}</span>
                </button>
              );
            })}
          </CommunityImportTagList>
        </CommunityImportPanelSection>
      )}

      {showCommunityAudio && sourceAudioUrl && (
        <div
          className={`${panelCardClasses} cursor-pointer transition-colors ${communityAudioActive ? 'border-primary bg-primary/10' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={communityAudioActive}
          aria-label="Selectionner ou deselectionner la prononciation communautaire"
          onClick={onToggleCommunityAudio}
          onKeyDown={(event) =>
            handleCardKeyToggle(event, onToggleCommunityAudio)
          }
        >
          <SectionHeader title="Prononciation" variant="foreground" />

          <div onClick={(event) => event.stopPropagation()}>
            <AudioPlayer audioUrl={sourceAudioUrl} />
          </div>
        </div>
      )}

      {communityNoteBlocks.length > 0 && (
        <CommunityImportNotesSection
          blocks={communityNoteBlocks}
          containerRef={communityNotesContainerRef}
          onClick={onCommunityNotesClick}
          onKeyDown={onCommunityNotesKeyDown}
        />
      )}
    </CommunityImportPanelShell>
  );
};
