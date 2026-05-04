'use client';

import type { KeyboardEvent, MouseEvent, RefObject } from 'react';
import type { NotesBlock } from '@/lib/words/notes';
import { RichTextViewer } from '@/components/shared';
import { CommunityImportPanelSection } from './CommunityImportPanelLayout';

type CommunityImportNotesSectionProps = {
  blocks: NotesBlock[];
  containerRef: RefObject<HTMLDivElement | null>;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export const CommunityImportNotesSection = ({
  blocks,
  containerRef,
  onClick,
  onKeyDown,
}: CommunityImportNotesSectionProps) => (
  <CommunityImportPanelSection title="Notes">
    <div
      ref={containerRef}
      className="space-x-3"
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <RichTextViewer blocks={blocks} />
    </div>
  </CommunityImportPanelSection>
);
