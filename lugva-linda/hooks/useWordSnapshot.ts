import type { Word } from '@prisma/client';
import type {
  EditableWordSnapshot,
  WordCommunityView,
} from '@/lib/words/community';
import { normalizeNotesBlocks } from '@/lib/words/notes';

type SnapshotMode = 'owner' | 'external';

type WordVisualMeta = {
  isExternal: boolean;
  ownerName?: string;
  primaryColor?: string;
};

const hasCommunityOwner = (
  word: Word | WordCommunityView,
): word is WordCommunityView => {
  return (
    typeof (word as WordCommunityView).owner?.displayName === 'string' &&
    typeof (word as WordCommunityView).owner?.colorHex === 'string'
  );
};

export const getWordVisualMeta = (
  word: Word | WordCommunityView,
  mode: SnapshotMode,
): WordVisualMeta => {
  const isExternal = mode === 'external' && hasCommunityOwner(word);

  return {
    isExternal,
    ownerName: isExternal ? word.owner.displayName : undefined,
    primaryColor: isExternal ? word.owner.colorHex : undefined,
  };
};

export const toWordSnapshot = (
  word: Word | WordCommunityView,
  mode: SnapshotMode,
): EditableWordSnapshot => {
  const visualMeta = getWordVisualMeta(word, mode);

  return {
    id: word.id,
    ownerId: word.ownerId,
    ownerName: visualMeta.ownerName,
    ownerColorHex: visualMeta.primaryColor,
    isOwnedByCurrentUser: !visualMeta.isExternal,
    languageId: word.languageId,
    term: word.term,
    translation: word.translation,
    tags: word.tags,
    notesBlocks: normalizeNotesBlocks(word.notesBlocks),
    synonyms: word.synonyms,
    sourceWordId: word.sourceWordId,
    customAudioUrl: word.customAudioUrl,
    relatedWords: word.relatedWords,
  };
};
