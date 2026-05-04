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

type CommunityImportOwnPanelProps = {
  preview: PreviewPayload;
  selection: CommunityImportSelectionState;
  ownNotesContainerRef: RefObject<HTMLDivElement | null>;
  onOwnNotesClick: (event: MouseEvent<HTMLDivElement>) => void;
  onOwnNotesKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export const CommunityImportOwnPanel = ({
  preview,
  selection,
  ownNotesContainerRef,
  onOwnNotesClick,
  onOwnNotesKeyDown,
}: CommunityImportOwnPanelProps) => {
  const {
    mandatoryTag,
    finalTranslation,
    translationReplacementActive,
    existingWord,
    finalTranslationSource,
    allCustomTags,
    selectedCommunityTagKeySet,
    keptOwnTagKeySet,
    toggleOwnTag,
    hasSelectableAudio,
    existingAudioUrl,
    keepOwnAudio,
    toggleOwnAudio,
    audioReplacementActive,
    ownAudioRemoved,
    includeCommunityAudio,
    sourceAudioUrl,
    finalAudioUrl,
    visibleOwnNoteBlocks,
  } = selection;

  return (
    <CommunityImportPanelShell
      header={
        <CommunityImportPanelHeader
          label="Ma version"
          term={preview.sourceWord.term}
          mandatoryTag={mandatoryTag}
        />
      }
    >
      {finalTranslation && (
        <CommunityImportTranslationCard
          translation={finalTranslation}
          showReplacement={translationReplacementActive}
          previousTranslation={existingWord?.translation}
          highlightTranslation={finalTranslationSource === 'community'}
        />
      )}

      {allCustomTags.length > 0 && (
        <CommunityImportPanelSection title="Tags personnalises">
          <CommunityImportTagList>
            {allCustomTags.map((tag) => {
              const isCommunitySelected =
                tag.inCommunity && selectedCommunityTagKeySet.has(tag.key);
              const isOwnKept = tag.inOwn && keptOwnTagKeySet.has(tag.key);
              const isOwnRemoved = tag.inOwn && !keptOwnTagKeySet.has(tag.key);
              const isCommunityOnly = tag.inCommunity && !tag.inOwn;

              if (isCommunityOnly && !isCommunitySelected) {
                return null;
              }

              if (isCommunityOnly) {
                return (
                  <span
                    key={`final-tag-${tag.key}`}
                    className="inline-flex min-w-0 items-center rounded-full border border-emerald-600/60 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                  >
                    <span className="truncate">{tag.value}</span>
                  </span>
                );
              }

              return (
                <button
                  type="button"
                  key={`final-tag-${tag.key}`}
                  className={`${isOwnRemoved ? 'border-destructive/60 bg-destructive/10 text-destructive line-through' : 'bg-background text-foreground border-border'} inline-flex min-w-0 cursor-pointer items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors`}
                  onClick={() => toggleOwnTag(tag.key)}
                  aria-pressed={isOwnKept}
                  aria-label={`Basculer le tag ${tag.value}`}
                >
                  <span className="truncate">{tag.value}</span>
                </button>
              );
            })}
          </CommunityImportTagList>
        </CommunityImportPanelSection>
      )}

      {hasSelectableAudio && (
        <div
          className={`${panelCardClasses} ${existingAudioUrl ? 'cursor-pointer transition-colors' : ''}`}
          role={existingAudioUrl ? 'button' : undefined}
          tabIndex={existingAudioUrl ? 0 : undefined}
          aria-pressed={existingAudioUrl ? keepOwnAudio : undefined}
          aria-label={
            existingAudioUrl
              ? 'Basculer la suppression de votre prononciation'
              : undefined
          }
          onClick={existingAudioUrl ? toggleOwnAudio : undefined}
          onKeyDown={
            existingAudioUrl
              ? (event) => handleCardKeyToggle(event, toggleOwnAudio)
              : undefined
          }
        >
          <SectionHeader title="Prononciation" variant="foreground" />

          {audioReplacementActive && existingAudioUrl && sourceAudioUrl ? (
            <>
              <p className="text-destructive mt-2 text-sm">
                Ancienne prononciation
              </p>
              <div
                className="mt-2"
                onClick={(event) => event.stopPropagation()}
              >
                <AudioPlayer audioUrl={existingAudioUrl} tone="muted" />
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                Nouvelle prononciation
              </p>
              <div
                className="mt-2"
                onClick={(event) => event.stopPropagation()}
              >
                <AudioPlayer audioUrl={sourceAudioUrl} tone="valid" />
              </div>
            </>
          ) : existingAudioUrl && ownAudioRemoved && !includeCommunityAudio ? (
            <>
              <p className="text-destructive mt-2 text-sm">
                Prononciation supprimée
              </p>
              <div
                className="mt-2"
                onClick={(event) => event.stopPropagation()}
              >
                <AudioPlayer audioUrl={existingAudioUrl} tone="muted" />
              </div>
            </>
          ) : includeCommunityAudio && sourceAudioUrl && !existingAudioUrl ? (
            <>
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                Prononciation communautaire
              </p>
              <div
                className="mt-2"
                onClick={(event) => event.stopPropagation()}
              >
                <AudioPlayer audioUrl={sourceAudioUrl} />
              </div>
            </>
          ) : finalAudioUrl ? (
            <div className="mt-2" onClick={(event) => event.stopPropagation()}>
              <AudioPlayer audioUrl={finalAudioUrl} />
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">
              Aucune prononciation selectionnée.
            </p>
          )}
        </div>
      )}

      {visibleOwnNoteBlocks.length > 0 && (
        <CommunityImportNotesSection
          blocks={visibleOwnNoteBlocks}
          containerRef={ownNotesContainerRef}
          onClick={onOwnNotesClick}
          onKeyDown={onOwnNotesKeyDown}
        />
      )}
    </CommunityImportPanelShell>
  );
};
