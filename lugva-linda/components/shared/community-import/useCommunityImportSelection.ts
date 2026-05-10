'use client';

import { useCallback, useMemo, useState, type SetStateAction } from 'react';
import { normalizeForLookup, normalizeText } from '@/lib/words/normalization';
import {
  extractNotesTextFromBlocks,
  normalizeNotesBlocks,
  type NotesBlock,
} from '@/lib/words/notes';
import type { PreviewPayload } from './useCommunityImportPreview';
import { CommunityImportSelection } from '@/lib/validation/schemas';

type TranslationSource = 'community' | 'own';

type TagDescriptor = {
  key: string;
  value: string;
  inCommunity: boolean;
  inOwn: boolean;
};

export type NoteDescriptor = {
  id: string;
  block: NotesBlock;
  inCommunity: boolean;
  inOwn: boolean;
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];

const buildTagDescriptors = (values: string[], origin: 'community' | 'own') => {
  const seen = new Set<string>();
  const tags: TagDescriptor[] = [];

  values.forEach((value) => {
    const normalized = normalizeForLookup(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    tags.push({
      key: normalized,
      value,
      inCommunity: origin === 'community',
      inOwn: origin === 'own',
    });
  });

  return tags;
};

const buildNoteDescriptors = (
  blocks: NotesBlock[] | null,
  origin: 'community' | 'own',
) => {
  const seen = new Set<string>();
  const notes: NoteDescriptor[] = [];

  const isSkippableEmptyBlock = (block: NotesBlock) => {
    const hasText = extractNotesTextFromBlocks([block]).length > 0;
    if (hasText) {
      return false;
    }

    return (
      block.type === 'paragraph' ||
      block.type === 'bulletListItem' ||
      block.type === 'numberedListItem' ||
      block.type === 'checkListItem' ||
      block.type === 'quote'
    );
  };

  (blocks ?? []).forEach((block) => {
    if (isSkippableEmptyBlock(block)) {
      return;
    }

    const normalizedId = normalizeText(block.id);
    if (!normalizedId || seen.has(normalizedId)) {
      return;
    }

    seen.add(normalizedId);
    notes.push({
      id: normalizedId,
      block,
      inCommunity: origin === 'community',
      inOwn: origin === 'own',
    });
  });

  return notes;
};

const mergeTagDescriptors = (
  communityTags: TagDescriptor[],
  ownTags: TagDescriptor[],
) => {
  const byKey = new Map<string, TagDescriptor>();

  ownTags.forEach((tag) => {
    byKey.set(tag.key, tag);
  });

  communityTags.forEach((tag) => {
    const current = byKey.get(tag.key);

    if (current) {
      byKey.set(tag.key, {
        ...current,
        inCommunity: true,
      });
      return;
    }

    byKey.set(tag.key, tag);
  });

  return Array.from(byKey.values());
};

const mergeNoteDescriptors = (
  communityNotes: NoteDescriptor[],
  ownNotes: NoteDescriptor[],
) => {
  const byId = new Map<string, NoteDescriptor>();

  ownNotes.forEach((note) => {
    byId.set(note.id, {
      ...note,
      inCommunity: false,
      inOwn: true,
    });
  });

  communityNotes.forEach((note) => {
    const current = byId.get(note.id);

    if (current) {
      byId.set(note.id, {
        ...current,
        block: note.block,
        inCommunity: true,
      });
      return;
    }

    byId.set(note.id, {
      ...note,
      inCommunity: true,
      inOwn: false,
    });
  });

  return Array.from(byId.values());
};

type SelectionOverrides = {
  key: string | null;
  finalTranslationSource?: TranslationSource;
  selectedCommunityTagKeys?: string[];
  keptOwnTagKeys?: string[];
  includeCommunityAudio?: boolean;
  keepOwnAudio?: boolean;
  selectedCommunityNoteIds?: string[];
  keptOwnNoteIds?: string[];
};

type SelectionDefaults = {
  finalTranslationSource: TranslationSource;
  selectedCommunityTagKeys: string[];
  keptOwnTagKeys: string[];
  includeCommunityAudio: boolean;
  keepOwnAudio: boolean;
  selectedCommunityNoteIds: string[];
  keptOwnNoteIds: string[];
};

export const useCommunityImportSelection = (preview: PreviewPayload | null) => {
  const existingWord = preview?.existingWord;
  const hasExistingWord = Boolean(existingWord);

  const communityCustomTags = useMemo(() => {
    if (!preview) {
      return [];
    }

    return buildTagDescriptors(
      preview.sourceWord.tags.filter((tag) => {
        const isAccepted =
          tag.toLocaleLowerCase() !==
          preview.sourceWord.mandatoryTag.toLocaleLowerCase();

        if (!isAccepted) return false;

        for (const ownTag of existingWord?.tags ?? []) {
          if (ownTag.toLocaleLowerCase() === tag.toLocaleLowerCase())
            return false;
        }

        return isAccepted;
      }),
      'community',
    );
  }, [existingWord?.tags, preview]);

  const ownCustomTags = useMemo(() => {
    if (!existingWord) {
      return [];
    }

    return buildTagDescriptors(
      existingWord.tags.filter((tag) => tag !== existingWord.mandatoryTag),
      'own',
    );
  }, [existingWord]);

  const allCustomTags = useMemo(
    () => mergeTagDescriptors(communityCustomTags, ownCustomTags),
    [communityCustomTags, ownCustomTags],
  );

  const ownNotes = useMemo(() => {
    return buildNoteDescriptors(
      normalizeNotesBlocks(existingWord?.notesBlocks) ?? null,
      'own',
    );
  }, [existingWord?.notesBlocks]);

  const communityNotes = useMemo(() => {
    const notes = buildNoteDescriptors(
      normalizeNotesBlocks(preview?.sourceWord.notesBlocks) ?? null,
      'community',
    );

    if (!existingWord || ownNotes.length === 0) {
      return notes;
    }

    const ownIds = new Set(ownNotes.map((note) => note.id));
    return notes.filter((note) => !ownIds.has(note.id));
  }, [existingWord, ownNotes, preview?.sourceWord.notesBlocks]);

  const allNotes = useMemo(
    () => mergeNoteDescriptors(communityNotes, ownNotes),
    [communityNotes, ownNotes],
  );

  const previewKey = preview
    ? `${preview.sourceWord.term}:${preview.sourceWord.mandatoryTag}`
    : null;

  const defaultSelection = useMemo<SelectionDefaults>(() => {
    if (!preview) {
      return {
        finalTranslationSource: 'own',
        selectedCommunityTagKeys: [],
        keptOwnTagKeys: [],
        includeCommunityAudio: false,
        keepOwnAudio: false,
        selectedCommunityNoteIds: [],
        keptOwnNoteIds: [],
      };
    }

    const translationMatchesOwn = Boolean(
      preview.existingWord?.translation &&
      preview.sourceWord.translation &&
      preview.existingWord.translation === preview.sourceWord.translation,
    );
    const audioMatchesOwn = Boolean(
      preview.existingWord?.customAudioUrl &&
      preview.sourceWord.customAudioUrl &&
      preview.existingWord.customAudioUrl === preview.sourceWord.customAudioUrl,
    );

    return {
      finalTranslationSource: translationMatchesOwn ? 'own' : 'community',
      selectedCommunityTagKeys: communityCustomTags.map((tag) => tag.key),
      keptOwnTagKeys: ownCustomTags.map((tag) => tag.key),
      includeCommunityAudio: Boolean(
        preview.sourceWord.customAudioUrl && !audioMatchesOwn,
      ),
      keepOwnAudio: Boolean(preview.existingWord?.customAudioUrl),
      selectedCommunityNoteIds: communityNotes.map((note) => note.id),
      keptOwnNoteIds: ownNotes.map((note) => note.id),
    };
  }, [preview, communityCustomTags, ownCustomTags, communityNotes, ownNotes]);

  const [overrides, setOverrides] = useState<SelectionOverrides>(() => ({
    key: previewKey,
  }));

  const resolvedOverrides =
    overrides.key === previewKey ? overrides : { key: previewKey };

  const finalTranslationSource =
    resolvedOverrides.finalTranslationSource ??
    defaultSelection.finalTranslationSource;
  const selectedCommunityTagKeys =
    resolvedOverrides.selectedCommunityTagKeys ??
    defaultSelection.selectedCommunityTagKeys;
  const keptOwnTagKeys =
    resolvedOverrides.keptOwnTagKeys ?? defaultSelection.keptOwnTagKeys;
  const includeCommunityAudio =
    resolvedOverrides.includeCommunityAudio ??
    defaultSelection.includeCommunityAudio;
  const keepOwnAudio =
    resolvedOverrides.keepOwnAudio ?? defaultSelection.keepOwnAudio;
  const selectedCommunityNoteIds =
    resolvedOverrides.selectedCommunityNoteIds ??
    defaultSelection.selectedCommunityNoteIds;
  const keptOwnNoteIds =
    resolvedOverrides.keptOwnNoteIds ?? defaultSelection.keptOwnNoteIds;

  const applyOverrides = useCallback(
    (next: Partial<SelectionOverrides>) => {
      setOverrides((current) => {
        const base = current.key === previewKey ? current : { key: previewKey };
        return {
          ...base,
          ...next,
          key: previewKey,
        };
      });
    },
    [previewKey],
  );

  const selectedCommunityTagKeySet = useMemo(
    () => new Set(selectedCommunityTagKeys),
    [selectedCommunityTagKeys],
  );
  const keptOwnTagKeySet = useMemo(
    () => new Set(keptOwnTagKeys),
    [keptOwnTagKeys],
  );
  const selectedCommunityNoteIdSet = useMemo(
    () => new Set(selectedCommunityNoteIds),
    [selectedCommunityNoteIds],
  );
  const keptOwnNoteIdSet = useMemo(
    () => new Set(keptOwnNoteIds),
    [keptOwnNoteIds],
  );
  const ownNoteIdSet = useMemo(
    () => new Set(ownNotes.map((note) => note.id)),
    [ownNotes],
  );
  const noteById = useMemo(
    () => new Map(allNotes.map((note) => [note.id, note])),
    [allNotes],
  );

  const sourceTranslation = preview?.sourceWord.translation ?? '';
  const sourceAudioUrl = preview?.sourceWord.customAudioUrl ?? undefined;
  const existingAudioUrl = existingWord?.customAudioUrl ?? undefined;
  const translationMatchesOwn = Boolean(
    existingWord?.translation &&
    sourceTranslation &&
    existingWord.translation === sourceTranslation,
  );
  const canSelectCommunityTranslation =
    hasExistingWord && !translationMatchesOwn;
  const showCommunityAudio = Boolean(
    sourceAudioUrl &&
    (!existingAudioUrl || sourceAudioUrl !== existingAudioUrl),
  );

  const finalTranslation = !preview
    ? ''
    : finalTranslationSource === 'community'
      ? preview.sourceWord.translation
      : (existingWord?.translation ?? preview.sourceWord.translation);

  const finalAudioUrl = useMemo(() => {
    if (includeCommunityAudio) {
      return sourceAudioUrl;
    }

    if (keepOwnAudio) {
      return existingAudioUrl;
    }

    return undefined;
  }, [includeCommunityAudio, keepOwnAudio, sourceAudioUrl, existingAudioUrl]);

  const toggleCommunityTag = useCallback(
    (tagKey: string) => {
      applyOverrides({
        selectedCommunityTagKeys: toggleValue(selectedCommunityTagKeys, tagKey),
      });
    },
    [applyOverrides, selectedCommunityTagKeys],
  );

  const toggleOwnTag = useCallback(
    (tagKey: string) => {
      applyOverrides({ keptOwnTagKeys: toggleValue(keptOwnTagKeys, tagKey) });
    },
    [applyOverrides, keptOwnTagKeys],
  );

  const toggleCommunityNote = useCallback(
    (noteId: string) => {
      applyOverrides({
        selectedCommunityNoteIds: toggleValue(selectedCommunityNoteIds, noteId),
      });
    },
    [applyOverrides, selectedCommunityNoteIds],
  );

  const toggleOwnNote = useCallback(
    (noteId: string) => {
      applyOverrides({ keptOwnNoteIds: toggleValue(keptOwnNoteIds, noteId) });
    },
    [applyOverrides, keptOwnNoteIds],
  );

  const toggleOwnAudio = useCallback(() => {
    if (!existingAudioUrl) return;

    applyOverrides({
      keepOwnAudio: !keepOwnAudio,
      includeCommunityAudio: includeCommunityAudio
        ? false
        : includeCommunityAudio,
    });
  }, [applyOverrides, existingAudioUrl, includeCommunityAudio, keepOwnAudio]);

  const setFinalTranslationSource = useCallback(
    (next: SetStateAction<TranslationSource>) => {
      const resolved =
        typeof next === 'function' ? next(finalTranslationSource) : next;
      applyOverrides({ finalTranslationSource: resolved });
    },
    [applyOverrides, finalTranslationSource],
  );

  const setIncludeCommunityAudio = useCallback(
    (next: SetStateAction<boolean>) => {
      const resolved =
        typeof next === 'function' ? next(includeCommunityAudio) : next;
      applyOverrides({ includeCommunityAudio: resolved });
    },
    [applyOverrides, includeCommunityAudio],
  );

  const toggleCommunityTranslation = useCallback(() => {
    setFinalTranslationSource((current) =>
      current === 'community' ? 'own' : 'community',
    );
  }, [setFinalTranslationSource]);

  const toggleCommunityAudio = useCallback(() => {
    setIncludeCommunityAudio((current) => !current);
  }, [setIncludeCommunityAudio]);

  const communityNoteIdSet = useMemo(
    () => new Set(communityNotes.map((note) => note.id)),
    [communityNotes],
  );
  const communityNoteBlocks = useMemo(
    () => communityNotes.map((note) => note.block),
    [communityNotes],
  );

  const visibleOwnNotes = useMemo(
    () =>
      allNotes.filter(
        (note) =>
          note.inOwn ||
          (note.inCommunity && selectedCommunityNoteIdSet.has(note.id)),
      ),
    [allNotes, selectedCommunityNoteIdSet],
  );
  const visibleOwnNoteBlocks = useMemo(
    () => visibleOwnNotes.map((note) => note.block),
    [visibleOwnNotes],
  );

  const translationReplacementActive = Boolean(
    existingWord?.translation &&
    finalTranslationSource === 'community' &&
    existingWord.translation !== sourceTranslation,
  );
  const hasSelectableAudio = Boolean(existingAudioUrl || sourceAudioUrl);
  const audioReplacementActive = Boolean(
    existingAudioUrl &&
    sourceAudioUrl &&
    includeCommunityAudio &&
    existingAudioUrl !== sourceAudioUrl,
  );
  const ownAudioRemoved = Boolean(existingAudioUrl) && !keepOwnAudio;

  const communityTranslationActive = finalTranslationSource === 'community';
  const communityAudioActive = includeCommunityAudio;

  const toggleCommunityNoteFromBlockId = useCallback(
    (blockId: string | null) => {
      const noteId = normalizeText(blockId ?? '');
      if (!noteId || !communityNoteIdSet.has(noteId)) {
        return;
      }

      toggleCommunityNote(noteId);
    },
    [communityNoteIdSet, toggleCommunityNote],
  );

  const toggleOwnNoteFromBlockId = useCallback(
    (blockId: string | null) => {
      const noteId = normalizeText(blockId ?? '');
      if (!noteId || !ownNoteIdSet.has(noteId)) {
        return;
      }

      toggleOwnNote(noteId);
    },
    [ownNoteIdSet, toggleOwnNote],
  );

  const buildPayload = useCallback((): CommunityImportSelection | null => {
    if (!preview) {
      return null;
    }

    return {
      useCommunityTranslation: finalTranslationSource === 'community',
      keepOwnTranslation: finalTranslationSource === 'own',
      communityTagKeys: allCustomTags
        .filter(
          (tag) => tag.inCommunity && selectedCommunityTagKeySet.has(tag.key),
        )
        .map((tag) => tag.key),
      keepOwnTagKeys: allCustomTags
        .filter((tag) => tag.inOwn && keptOwnTagKeySet.has(tag.key))
        .map((tag) => tag.key),
      useCommunityAudio: includeCommunityAudio,
      keepOwnAudio: keepOwnAudio,
      communityNoteBlockIds: allNotes
        .filter(
          (note) => note.inCommunity && selectedCommunityNoteIdSet.has(note.id),
        )
        .map((note) => note.id),
      keepOwnNoteBlockIds: allNotes
        .filter((note) => note.inOwn && keptOwnNoteIdSet.has(note.id))
        .map((note) => note.id),
    };
  }, [
    preview,
    finalTranslationSource,
    allCustomTags,
    selectedCommunityTagKeySet,
    keptOwnTagKeySet,
    includeCommunityAudio,
    keepOwnAudio,
    allNotes,
    selectedCommunityNoteIdSet,
    keptOwnNoteIdSet,
  ]);

  return {
    existingWord,
    hasExistingWord,
    mandatoryTag: preview?.sourceWord.mandatoryTag ?? '',
    communityCustomTags,
    ownCustomTags,
    allCustomTags,
    communityNotes,
    ownNotes,
    allNotes,
    selectedCommunityTagKeySet,
    keptOwnTagKeySet,
    selectedCommunityNoteIdSet,
    keptOwnNoteIdSet,
    ownNoteIdSet,
    noteById,
    sourceTranslation,
    sourceAudioUrl,
    existingAudioUrl,
    canSelectCommunityTranslation,
    showCommunityAudio,
    finalTranslation,
    finalAudioUrl,
    includeCommunityAudio,
    keepOwnAudio,
    toggleOwnAudio,
    setFinalTranslationSource,
    setIncludeCommunityAudio,
    toggleCommunityTranslation,
    toggleCommunityAudio,
    toggleCommunityTag,
    toggleOwnTag,
    toggleCommunityNote,
    toggleOwnNote,
    toggleCommunityNoteFromBlockId,
    toggleOwnNoteFromBlockId,
    communityNoteIdSet,
    communityNoteBlocks,
    visibleOwnNoteBlocks,
    translationReplacementActive,
    hasSelectableAudio,
    audioReplacementActive,
    ownAudioRemoved,
    communityTranslationActive,
    communityAudioActive,
    finalTranslationSource,
    buildPayload,
  };
};

export type CommunityImportSelectionState = ReturnType<
  typeof useCommunityImportSelection
>;
