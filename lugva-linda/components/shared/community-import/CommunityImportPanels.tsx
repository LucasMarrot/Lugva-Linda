'use client';

import { useRef, type KeyboardEvent, type MouseEvent } from 'react';
import type { PreviewPayload } from './useCommunityImportPreview';
import type { CommunityImportSelectionState } from './useCommunityImportSelection';
import {
  useDecorateCommunityNotes,
  useDecorateOwnNotes,
} from './useDecorateNoteBlocks';
import { CommunityImportCommunityPanel } from './CommunityImportCommunityPanel';
import { CommunityImportOwnPanel } from './CommunityImportOwnPanel';

type CommunityImportPanelsProps = {
  preview: PreviewPayload;
  selection: CommunityImportSelectionState;
};

export const CommunityImportPanels = ({
  preview,
  selection,
}: CommunityImportPanelsProps) => {
  const communityNotesContainerRef = useRef<HTMLDivElement | null>(null);
  const ownNotesContainerRef = useRef<HTMLDivElement | null>(null);

  useDecorateCommunityNotes({
    containerRef: communityNotesContainerRef,
    selectedCommunityNoteIdSet: selection.selectedCommunityNoteIdSet,
    communityNoteBlocks: selection.communityNoteBlocks,
  });

  useDecorateOwnNotes({
    containerRef: ownNotesContainerRef,
    noteById: selection.noteById,
    ownNoteIdSet: selection.ownNoteIdSet,
    keptOwnNoteIdSet: selection.keptOwnNoteIdSet,
    selectedCommunityNoteIdSet: selection.selectedCommunityNoteIdSet,
    visibleOwnNoteBlocks: selection.visibleOwnNoteBlocks,
  });

  const handleCommunityNotesClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const blockElement = target.closest<HTMLElement>(
      '.bn-block-outer[data-id]',
    );

    if (!blockElement) {
      return;
    }

    selection.toggleCommunityNoteFromBlockId(
      blockElement.getAttribute('data-id'),
    );
  };

  const handleCommunityNotesKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event.target as HTMLElement;
    const blockElement = target.closest<HTMLElement>(
      '.bn-block-outer[data-id]',
    );

    if (!blockElement) {
      return;
    }

    event.preventDefault();
    selection.toggleCommunityNoteFromBlockId(
      blockElement.getAttribute('data-id'),
    );
  };

  const handleOwnNotesClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const blockElement = target.closest<HTMLElement>(
      '.bn-block-outer[data-id]',
    );

    if (!blockElement) {
      return;
    }

    selection.toggleOwnNoteFromBlockId(blockElement.getAttribute('data-id'));
  };

  const handleOwnNotesKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event.target as HTMLElement;
    const blockElement = target.closest<HTMLElement>(
      '.bn-block-outer[data-id]',
    );

    if (!blockElement) {
      return;
    }

    event.preventDefault();
    selection.toggleOwnNoteFromBlockId(blockElement.getAttribute('data-id'));
  };

  return (
    <div className="bg-primary grid h-full min-h-0 grid-rows-2 gap-2 lg:grid-cols-2 lg:grid-rows-1">
      <CommunityImportCommunityPanel
        preview={preview}
        selection={selection}
        communityNotesContainerRef={communityNotesContainerRef}
        onCommunityNotesClick={handleCommunityNotesClick}
        onCommunityNotesKeyDown={handleCommunityNotesKeyDown}
        onToggleCommunityTranslation={selection.toggleCommunityTranslation}
        onToggleCommunityAudio={selection.toggleCommunityAudio}
      />
      <CommunityImportOwnPanel
        preview={preview}
        selection={selection}
        ownNotesContainerRef={ownNotesContainerRef}
        onOwnNotesClick={handleOwnNotesClick}
        onOwnNotesKeyDown={handleOwnNotesKeyDown}
      />
    </div>
  );
};
