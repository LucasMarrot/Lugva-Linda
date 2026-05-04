'use client';

import { useEffect, type RefObject } from 'react';
import { normalizeText } from '@/lib/words/normalization';
import type { NotesBlock } from '@/lib/words/notes';
import type { NoteDescriptor } from './useCommunityImportSelection';

type CommunityNotesDecorationArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  selectedCommunityNoteIdSet: Set<string>;
  communityNoteBlocks: NotesBlock[];
};

type OwnNotesDecorationArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  noteById: Map<string, NoteDescriptor>;
  ownNoteIdSet: Set<string>;
  keptOwnNoteIdSet: Set<string>;
  selectedCommunityNoteIdSet: Set<string>;
  visibleOwnNoteBlocks: NotesBlock[];
};

export const useDecorateCommunityNotes = ({
  containerRef,
  selectedCommunityNoteIdSet,
  communityNoteBlocks,
}: CommunityNotesDecorationArgs) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const blockElements = container.querySelectorAll<HTMLElement>(
        '.bn-block-outer[data-id]',
      );

      blockElements.forEach((blockElement) => {
        const noteId = normalizeText(blockElement.dataset.id ?? '');
        const isSelected =
          Boolean(noteId) && selectedCommunityNoteIdSet.has(noteId);

        blockElement.tabIndex = 0;
        blockElement.setAttribute('role', 'button');
        blockElement.setAttribute(
          'aria-label',
          'Selectionner ou deselectionner ce bloc de note',
        );
        blockElement.setAttribute(
          'aria-pressed',
          isSelected ? 'true' : 'false',
        );

        if (isSelected) {
          blockElement.style.border = '1px solid var(--primary)';
          blockElement.style.borderRadius = '0.75rem';
          blockElement.style.backgroundColor =
            'color-mix(in oklab, var(--primary) 10%, transparent)';
          blockElement.style.padding = '0.3rem';
          blockElement.style.margin = '0.3rem 0';
        } else {
          blockElement.style.border = '';
          blockElement.style.borderRadius = '';
          blockElement.style.backgroundColor = '';
          blockElement.style.padding = '';
          blockElement.style.margin = '';
          blockElement.style.cursor = 'pointer';
          blockElement.style.transition = 'all 0.4s';
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [containerRef, communityNoteBlocks, selectedCommunityNoteIdSet]);
};

export const useDecorateOwnNotes = ({
  containerRef,
  noteById,
  ownNoteIdSet,
  keptOwnNoteIdSet,
  selectedCommunityNoteIdSet,
  visibleOwnNoteBlocks,
}: OwnNotesDecorationArgs) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const blockElements = container.querySelectorAll<HTMLElement>(
        '.bn-block-outer[data-id]',
      );

      blockElements.forEach((blockElement) => {
        const noteId = normalizeText(blockElement.dataset.id ?? '');
        const descriptor = noteById.get(noteId);
        const isOwn = Boolean(noteId) && ownNoteIdSet.has(noteId);
        const isOwnKept = Boolean(noteId) && keptOwnNoteIdSet.has(noteId);
        const isCommunitySelected =
          Boolean(noteId) && selectedCommunityNoteIdSet.has(noteId);
        const isCommunityOnly = Boolean(
          descriptor?.inCommunity && !descriptor?.inOwn,
        );

        blockElement.tabIndex = isOwn ? 0 : -1;
        blockElement.setAttribute('role', isOwn ? 'button' : 'article');
        blockElement.setAttribute(
          'aria-label',
          isOwn
            ? 'Selectionner ou deselectionner votre bloc de note'
            : 'Bloc de note communautaire',
        );
        blockElement.setAttribute(
          'aria-pressed',
          isOwn ? (isOwnKept ? 'true' : 'false') : 'true',
        );

        blockElement.style.border = '';
        blockElement.style.borderRadius = '';
        blockElement.style.backgroundColor = '';
        blockElement.style.padding = '';
        blockElement.style.margin = '';
        blockElement.style.textDecoration = '';
        blockElement.style.color = '';
        blockElement.style.cursor = isOwn ? 'pointer' : 'default';
        blockElement.style.transition = 'all 0.4s';

        if (isOwn && !isOwnKept) {
          blockElement.style.border = '1px solid var(--destructive)';
          blockElement.style.borderRadius = '0.75rem';
          blockElement.style.backgroundColor =
            'color-mix(in oklab, var(--destructive) 10%, transparent)';
          blockElement.style.padding = '0.3rem';
          blockElement.style.margin = '0.3rem 0';
          blockElement.style.textDecoration = 'line-through';
          blockElement.style.textDecorationColor = 'var(--destructive)';
          return;
        }

        if (isCommunityOnly && isCommunitySelected) {
          blockElement.style.border = '1px solid rgb(22 163 74)';
          blockElement.style.borderRadius = '0.75rem';
          blockElement.style.backgroundColor =
            'color-mix(in oklab, rgb(22 163 74) 10%, transparent)';
          blockElement.style.padding = '0.3rem';
          blockElement.style.margin = '0.3rem 0';
          return;
        }

        if (isOwn && isOwnKept) {
          blockElement.style.border = '';
          blockElement.style.borderRadius = '';
          blockElement.style.backgroundColor =
            'color-mix(in oklab, var(--muted) 22%, transparent)';
          blockElement.style.padding = '';
          blockElement.style.margin = '';
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    containerRef,
    noteById,
    ownNoteIdSet,
    keptOwnNoteIdSet,
    selectedCommunityNoteIdSet,
    visibleOwnNoteBlocks,
  ]);
};
