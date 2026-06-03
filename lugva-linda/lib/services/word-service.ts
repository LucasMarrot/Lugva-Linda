import type { SupabaseClient } from '@supabase/supabase-js';
import { ExerciseCategory, ExerciseType, Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';
import { toNullableJsonInput } from '@/lib/prisma-json';
import { createClient } from '@/lib/supabase/server';
import {
  type CopyFieldOptions,
  type CommunityMemberSummary,
  type WordCommunityView,
  type WordMergeStrategy,
  toDisplayName,
} from '@/lib/words/community';
import {
  DuplicateError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@/lib/errors';
import {
  CommunityImportSelection,
  wordWriteSchema,
} from '@/lib/validation/schemas';
import {
  assertUserLanguageAccess,
  getFirstUserLanguage,
} from '@/lib/services/language-service';
import {
  normalizeForLookup,
  normalizeFormStringArray,
  normalizeText,
} from '@/lib/words/normalization';
import {
  normalizeNotesBlocksForPersistence,
  parseNotesBlocks,
} from '@/lib/words/notes';
import {
  mergeArrayValues,
  mergeNotesBlocksValue,
  scoreSearchResult,
} from '@/lib/services/community-merge';
import { MANDATORY_TAGS_SET, type MandatoryTag } from '@/lib/words/tags';

const AUDIO_BUCKET = 'audio-files';
const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
const AUDIO_ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
]);
const TRASH_RETENTION_DAYS = 30;

type WordInput = {
  term: string;
  translation: string;
  tags: string[];
  synonyms: string[];
  relatedWords: string[];
  notesBlocks: ReturnType<typeof normalizeNotesBlocksForPersistence>;
  languageId?: string;
};

type WordWithOwner = Awaited<ReturnType<typeof findWordWithOwnerById>>;

const ACTIVE_DELETE_TOKEN = BigInt(0);

const retentionDate = () => {
  const now = new Date();
  const purgeAfter = new Date(now);
  purgeAfter.setDate(purgeAfter.getDate() + TRASH_RETENTION_DAYS);
  return { now, purgeAfter };
};

const getFileExtension = (file: File) => {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 8) {
    return fromName;
  }

  if (file.type === 'audio/mpeg') return 'mp3';
  if (file.type === 'audio/mp3') return 'mp3';
  if (file.type === 'audio/mp4') return 'm4a';
  if (file.type === 'audio/m4a') return 'm4a';
  if (file.type === 'audio/x-m4a') return 'm4a';
  if (file.type === 'audio/aac') return 'aac';
  if (file.type === 'audio/ogg') return 'ogg';
  if (file.type === 'audio/wav') return 'wav';
  return 'webm';
};

const deleteAudioFromStorage = async (
  supabase: SupabaseClient,
  path: string,
) => {
  const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path]);

  if (error) {
    throw new StorageError('Suppression audio impossible. Reessayez.');
  }
};

const validateAudioFile = (file: File) => {
  if (!AUDIO_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ValidationError(
      'Format audio non supporté.',
      'INVALID_AUDIO_TYPE',
    );
  }

  if (file.size > AUDIO_MAX_BYTES) {
    throw new ValidationError(
      'Fichier audio trop volumineux.',
      'AUDIO_TOO_LARGE',
    );
  }
};

const uploadAudio = async (
  supabase: SupabaseClient,
  ownerId: string,
  file: File,
) => {
  validateAudioFile(file);

  const extension = getFileExtension(file);
  const objectPath = `${ownerId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new StorageError('Impossible de sauvegarder le fichier audio.');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(objectPath);

  return {
    customAudioPath: objectPath,
    customAudioUrl: publicUrl,
  };
};

const resolveLanguageId = async (userId: string, languageId?: string) => {
  if (languageId && languageId.length > 0) {
    await assertUserLanguageAccess(userId, languageId);
    return languageId;
  }

  const firstLanguage = await getFirstUserLanguage(userId);
  if (!firstLanguage) {
    throw new NotFoundError('Aucune langue trouvee pour cet utilisateur.');
  }

  return firstLanguage.id;
};

const resolveMandatoryTag = (tags: string[]): MandatoryTag => {
  const found = tags.find((tag): tag is MandatoryTag =>
    MANDATORY_TAGS_SET.has(tag),
  );

  if (!found) {
    throw new ValidationError('La nature du mot est obligatoire.');
  }
  return found;
};

const buildInput = (input: WordInput) => {
  const term = normalizeText(input.term);
  const translation = normalizeText(input.translation);

  const parsedInput = wordWriteSchema.parse({
    term,
    translation,
    tags: input.tags,
    synonyms: input.synonyms,
    relatedWords: input.relatedWords,
    notesBlocks: input.notesBlocks,
    languageId: input.languageId,
  });

  const mandatoryTag = resolveMandatoryTag(parsedInput.tags);

  return {
    term: parsedInput.term,
    termNormalized: normalizeForLookup(term),
    translation: parsedInput.translation,
    translationNormalized: normalizeForLookup(translation),
    mandatoryTag,
    tags: parsedInput.tags,
    synonyms: parsedInput.synonyms,
    relatedWords: parsedInput.relatedWords,
    notesBlocks: normalizeNotesBlocksForPersistence(parsedInput.notesBlocks),
  };
};

const toCommunityView = (
  word: NonNullable<WordWithOwner>,
  viewerId: string,
): WordCommunityView => ({
  ...word,
  owner: {
    id: word.owner.id,
    email: word.owner.email,
    colorHex: word.owner.colorHex,
    displayName: toDisplayName(
      word.owner.email,
      word.owner.id,
      word.owner.username,
    ),
  },
  isOwnedByCurrentUser: word.ownerId === viewerId,
});

const assertNoActiveDuplicate = async (
  ownerId: string,
  languageId: string,
  termNormalized: string,
  mandatoryTag: MandatoryTag,
  excludeWordId?: string,
) => {
  const duplicate = await prisma.word.findFirst({
    where: {
      ownerId,
      languageId,
      termNormalized,
      mandatoryTag,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
      ...(excludeWordId ? { id: { not: excludeWordId } } : {}),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new DuplicateError('Ce mot existe deja avec cette nature.');
  }
};

export const checkWordTermNatureDuplicateForOwner = async (
  ownerId: string,
  languageId: string,
  term: string,
  mandatoryTag: MandatoryTag,
  excludeWordId?: string,
) => {
  const termNormalized = normalizeForLookup(term);

  const duplicate = await prisma.word.findFirst({
    where: {
      ownerId,
      languageId,
      termNormalized,
      mandatoryTag,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
      ...(excludeWordId ? { id: { not: excludeWordId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(duplicate);
};

export const parseWordFormData = (formData: FormData): WordInput => {
  const notesBlocksRaw = String(formData.get('notesBlocks') ?? '').trim();
  const parsedNotesBlocks = notesBlocksRaw
    ? parseNotesBlocks(notesBlocksRaw)
    : null;

  return {
    term: String(formData.get('word') ?? formData.get('term') ?? ''),
    translation: String(formData.get('translation') ?? ''),
    tags: normalizeFormStringArray(formData.getAll('tags')),
    synonyms: normalizeFormStringArray(formData.getAll('synonyms')),
    relatedWords: normalizeFormStringArray(formData.getAll('relatedWords')),
    notesBlocks: normalizeNotesBlocksForPersistence(parsedNotesBlocks),
    languageId:
      normalizeText(String(formData.get('languageId') ?? '')) || undefined,
  };
};

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const toUniqueTermsByNormalized = (values: string[]) => {
  const uniqueByNormalized = new Map<string, string>();

  for (const value of values) {
    const normalizedText = normalizeText(value);
    if (!normalizedText) continue;

    const normalizedLookup = normalizeForLookup(normalizedText);
    if (!uniqueByNormalized.has(normalizedLookup)) {
      uniqueByNormalized.set(normalizedLookup, normalizedText);
    }
  }

  return uniqueByNormalized;
};

const mergeTermsByNormalized = (current: string[], additions: string[]) => {
  const merged = toUniqueTermsByNormalized(current);

  for (const [normalized, term] of toUniqueTermsByNormalized(additions)) {
    if (!merged.has(normalized)) {
      merged.set(normalized, term);
    }
  }

  return Array.from(merged.values());
};

const removeTermsByNormalized = (
  values: string[],
  termsToRemove: Set<string>,
) => {
  const nextValues = new Map<string, string>();

  for (const value of values) {
    const normalizedText = normalizeText(value);
    if (!normalizedText) continue;

    const normalizedLookup = normalizeForLookup(normalizedText);
    if (termsToRemove.has(normalizedLookup)) {
      continue;
    }

    if (!nextValues.has(normalizedLookup)) {
      nextValues.set(normalizedLookup, normalizedText);
    }
  }

  return Array.from(nextValues.values());
};

const sanitizeSynonymsForTerm = (synonyms: string[], term: string) =>
  removeTermsByNormalized(synonyms, new Set([normalizeForLookup(term)]));

type SynchronizeSynonymConnectionsInput = {
  ownerId: string;
  languageId: string;
  wordId: string;
  previousTerm: string;
  nextTerm: string;
  previousSynonyms: string[];
  nextSynonyms: string[];
};

const synchronizeSynonymConnections = async (
  tx: Prisma.TransactionClient,
  input: SynchronizeSynonymConnectionsInput,
) => {
  const previousSynonyms = toUniqueTermsByNormalized(input.previousSynonyms);
  const nextSynonyms = toUniqueTermsByNormalized(input.nextSynonyms);

  const removedSynonymLookups = new Set<string>();
  for (const normalized of previousSynonyms.keys()) {
    if (!nextSynonyms.has(normalized)) {
      removedSynonymLookups.add(normalized);
    }
  }

  const candidateLookups = new Set<string>([
    ...Array.from(removedSynonymLookups),
    ...Array.from(nextSynonyms.keys()),
  ]);

  if (candidateLookups.size === 0) {
    return;
  }

  const relatedWords = await tx.word.findMany({
    where: {
      ownerId: input.ownerId,
      languageId: input.languageId,
      id: { not: input.wordId },
      termNormalized: { in: Array.from(candidateLookups) },
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
    select: {
      id: true,
      termNormalized: true,
      synonyms: true,
    },
  });

  const previousTermLookup = normalizeForLookup(input.previousTerm);
  const nextTermLookup = normalizeForLookup(input.nextTerm);
  const hasRenamedTerm = previousTermLookup !== nextTermLookup;
  const connectedTerms = toUniqueTermsByNormalized([
    input.nextTerm,
    ...nextSynonyms.values(),
  ]);

  for (const relatedWord of relatedWords) {
    const wasConnected = previousSynonyms.has(relatedWord.termNormalized);
    const isConnected = nextSynonyms.has(relatedWord.termNormalized);

    if (!wasConnected && !isConnected) {
      continue;
    }

    let nextRelatedSynonyms = relatedWord.synonyms;
    const termsToRemove = new Set<string>();

    if (wasConnected && !isConnected) {
      termsToRemove.add(previousTermLookup);
      termsToRemove.add(nextTermLookup);
    } else if (hasRenamedTerm) {
      termsToRemove.add(previousTermLookup);
    }

    if (termsToRemove.size > 0) {
      nextRelatedSynonyms = removeTermsByNormalized(
        nextRelatedSynonyms,
        termsToRemove,
      );
    }

    if (isConnected) {
      const connectedTermsForRelatedWord: string[] = [];

      for (const [normalized, term] of connectedTerms.entries()) {
        if (normalized !== relatedWord.termNormalized) {
          connectedTermsForRelatedWord.push(term);
        }
      }

      nextRelatedSynonyms = mergeTermsByNormalized(
        nextRelatedSynonyms,
        connectedTermsForRelatedWord,
      );
    }

    if (!areStringArraysEqual(relatedWord.synonyms, nextRelatedSynonyms)) {
      await tx.word.update({
        where: { id: relatedWord.id },
        data: { synonyms: nextRelatedSynonyms },
      });
    }
  }
};

export const createWordForUser = async (
  userId: string,
  input: WordInput,
  options?: { audioFile?: File | null; supabase?: SupabaseClient },
) => {
  const languageId = await resolveLanguageId(userId, input.languageId);
  const normalizedInput = buildInput(input);
  const sanitizedSynonyms = sanitizeSynonymsForTerm(
    normalizedInput.synonyms,
    normalizedInput.term,
  );
  const { notesBlocks, ...wordData } = normalizedInput;

  await assertNoActiveDuplicate(
    userId,
    languageId,
    normalizedInput.termNormalized,
    normalizedInput.mandatoryTag,
  );

  let audioData:
    | { customAudioPath: string; customAudioUrl: string }
    | undefined;
  if (options?.audioFile && options.supabase && options.audioFile.size > 0) {
    audioData = await uploadAudio(options.supabase, userId, options.audioFile);
  }

  return prisma.$transaction(async (tx) => {
    const word = await tx.word.create({
      data: {
        ownerId: userId,
        createdById: userId,
        languageId,
        ...wordData,
        synonyms: sanitizedSynonyms,
        notesBlocks: toNullableJsonInput(notesBlocks),
        deleteToken: ACTIVE_DELETE_TOKEN,
        ...(audioData ?? {}),
      },
    });

    await tx.card.createMany({
      data: [
        {
          wordId: word.id,
          ownerId: userId,
          languageId,
          category: ExerciseCategory.READING,
          type: ExerciseType.RECOGNITION,
        },
        {
          wordId: word.id,
          ownerId: userId,
          languageId,
          category: ExerciseCategory.WRITING,
          type: ExerciseType.REVERSE,
        },
        {
          wordId: word.id,
          ownerId: userId,
          languageId,
          category: ExerciseCategory.WRITING,
          type: ExerciseType.SPELLING,
        },
      ],
    });

    await synchronizeSynonymConnections(tx, {
      ownerId: userId,
      languageId,
      wordId: word.id,
      previousTerm: word.term,
      nextTerm: word.term,
      previousSynonyms: [],
      nextSynonyms: word.synonyms,
    });

    return word;
  });
};

export const searchWordsInLanguage = async (
  viewerId: string,
  languageId: string,
  query: string,
) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const words = await prisma.word.findMany({
    where: {
      languageId,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
      OR: [
        { term: { contains: normalizedQuery, mode: 'insensitive' } },
        { translation: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
    take: 60,
  });

  const mapped = words.map((word) => toCommunityView(word, viewerId));

  return mapped
    .sort((left, right) => {
      const scoreDiff =
        scoreSearchResult(normalizedQuery, right) -
        scoreSearchResult(normalizedQuery, left);
      if (scoreDiff !== 0) return scoreDiff;

      return left.term.localeCompare(right.term, 'fr', {
        sensitivity: 'base',
      });
    })
    .slice(0, 20);
};

export const listCustomTagsForOwnerInLanguage = async (
  ownerId: string,
  languageId: string,
) => {
  const words = await prisma.word.findMany({
    where: {
      ownerId,
      languageId,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
    select: {
      tags: true,
    },
  });

  const customTagByNormalized = new Map<string, string>();

  for (const word of words) {
    for (const tag of word.tags) {
      if (!MANDATORY_TAGS_SET.has(tag)) {
        const normalizedTag = normalizeForLookup(tag);
        if (!customTagByNormalized.has(normalizedTag)) {
          customTagByNormalized.set(normalizedTag, tag);
        }
      }
    }
  }

  return Array.from(customTagByNormalized.values()).sort((left, right) =>
    left.localeCompare(right, 'fr', { sensitivity: 'base' }),
  );
};

export const findWordByTermForOwner = async (
  ownerId: string,
  languageId: string,
  text: string,
) => {
  const normalized = normalizeForLookup(text);

  return prisma.word.findFirst({
    where: {
      ownerId,
      languageId,
      termNormalized: normalized,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
  });
};

const findWordWithOwnerById = async (wordId: string) =>
  prisma.word.findUnique({
    where: { id: wordId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
  });

const buildIncomingCopyData = (
  sourceWord: NonNullable<WordWithOwner>,
  options: CopyFieldOptions,
) => ({
  term: sourceWord.term,
  termNormalized: sourceWord.termNormalized,
  translation: sourceWord.translation,
  translationNormalized: sourceWord.translationNormalized,
  tags: options.tags ? sourceWord.tags : [sourceWord.mandatoryTag],
  synonyms: options.synonyms ? sourceWord.synonyms : [],
  notesBlocks: options.notes
    ? normalizeNotesBlocksForPersistence(sourceWord.notesBlocks)
    : null,
  customAudioUrl: options.audio ? sourceWord.customAudioUrl : null,
});

const toLookupKeySet = (values: string[]) =>
  new Set(values.map((value) => normalizeForLookup(value)));

const selectCustomTagsByLookup = (
  availableTags: string[],
  mandatoryTag: string,
  selectedLookupKeys: string[],
) => {
  const selected = toLookupKeySet(selectedLookupKeys);

  return availableTags.filter((tag) => {
    if (tag === mandatoryTag) {
      return false;
    }

    return selected.has(normalizeForLookup(tag));
  });
};

const selectNotesBlocksById = (
  blocks: ReturnType<typeof normalizeNotesBlocksForPersistence>,
  selectedBlockIds: string[],
) => {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  const selectedIds = new Set(
    selectedBlockIds.map((value) => normalizeText(value)),
  );

  return blocks.filter((block) => selectedIds.has(normalizeText(block.id)));
};

const mergeSelectedNotesBlocks = (
  ownBlocks: ReturnType<typeof normalizeNotesBlocksForPersistence>,
  incomingBlocks: ReturnType<typeof normalizeNotesBlocksForPersistence>,
) => {
  if (
    (!ownBlocks || ownBlocks.length === 0) &&
    (!incomingBlocks || incomingBlocks.length === 0)
  ) {
    return null;
  }

  const merged = ownBlocks ? [...ownBlocks] : [];
  const indexById = new Map<string, number>();

  merged.forEach((block, index) => {
    indexById.set(block.id, index);
  });

  incomingBlocks?.forEach((block) => {
    const existingIndex = indexById.get(block.id);

    if (typeof existingIndex === 'number') {
      merged[existingIndex] = block;
      return;
    }

    indexById.set(block.id, merged.length);
    merged.push(block);
  });

  return merged.length > 0 ? merged : null;
};

export const listCommunityMembers = async (): Promise<
  CommunityMemberSummary[]
> => {
  const members = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      colorHex: true,
      username: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
  });

  return members.map((member) => ({
    id: member.id,
    email: member.email,
    colorHex: member.colorHex,
    displayName: toDisplayName(member.email, member.id, member.username),
  }));
};

export const listMemberWordsInLanguage = async (
  viewerId: string,
  memberId: string,
  languageId: string,
  query?: string,
) => {
  const normalizedQuery = normalizeText(query ?? '');

  const words = await prisma.word.findMany({
    where: {
      ownerId: memberId,
      languageId,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
      ...(normalizedQuery
        ? {
            OR: [
              { term: { contains: normalizedQuery, mode: 'insensitive' } },
              {
                translation: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
    orderBy: {
      term: 'asc',
    },
  });

  return words.map((word) => toCommunityView(word, viewerId));
};

export const getCommunityWordImportPreview = async (
  viewerId: string,
  sourceWordId: string,
  options: CopyFieldOptions,
) => {
  const sourceWord = await findWordWithOwnerById(sourceWordId);
  if (
    !sourceWord ||
    sourceWord.isDeleted ||
    sourceWord.deleteToken !== ACTIVE_DELETE_TOKEN
  ) {
    throw new NotFoundError('Mot source introuvable.');
  }

  if (sourceWord.ownerId === viewerId) {
    throw new ValidationError(
      'Ce mot vous appartient deja.',
      'OWN_WORD_IMPORT_FORBIDDEN',
    );
  }

  await assertUserLanguageAccess(viewerId, sourceWord.languageId);

  const existingWord = await prisma.word.findFirst({
    where: {
      ownerId: viewerId,
      languageId: sourceWord.languageId,
      termNormalized: sourceWord.termNormalized,
      mandatoryTag: sourceWord.mandatoryTag,
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
  });

  return {
    sourceWord: toCommunityView(sourceWord, viewerId),
    existingWord: existingWord ? toCommunityView(existingWord, viewerId) : null,
    incomingData: buildIncomingCopyData(sourceWord, options),
  };
};

export const importCommunityWordForUser = async (
  viewerId: string,
  sourceWordId: string,
  options: CopyFieldOptions,
  mergeStrategy?: WordMergeStrategy,
) => {
  const preview = await getCommunityWordImportPreview(
    viewerId,
    sourceWordId,
    options,
  );

  if (!preview.existingWord) {
    const created = await prisma.$transaction(async (tx) => {
      const word = await tx.word.create({
        data: {
          ownerId: viewerId,
          createdById: viewerId,
          sourceWordId: preview.sourceWord.id,
          languageId: preview.sourceWord.languageId,
          term: preview.incomingData.term,
          termNormalized: preview.incomingData.termNormalized,
          translation: preview.incomingData.translation,
          translationNormalized: preview.incomingData.translationNormalized,
          mandatoryTag: preview.sourceWord.mandatoryTag,
          tags: preview.incomingData.tags,
          synonyms: preview.incomingData.synonyms,
          notesBlocks: toNullableJsonInput(preview.incomingData.notesBlocks),
          customAudioUrl: preview.incomingData.customAudioUrl,
          customAudioPath: null,
          deleteToken: ACTIVE_DELETE_TOKEN,
        },
      });

      await tx.card.createMany({
        data: [
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.READING,
            type: ExerciseType.RECOGNITION,
          },
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.WRITING,
            type: ExerciseType.REVERSE,
          },
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.WRITING,
            type: ExerciseType.SPELLING,
          },
        ],
      });

      return tx.word.findUnique({
        where: { id: word.id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              colorHex: true,
              username: true,
            },
          },
        },
      });
    });

    if (!created) {
      throw new NotFoundError('Impossible de finaliser la copie du mot.');
    }

    return {
      mode: 'created' as const,
      word: toCommunityView(created, viewerId),
    };
  }

  if (!mergeStrategy) {
    throw new ValidationError(
      'Fusion requise: ce mot existe deja dans votre encyclopedie.',
      'MERGE_REQUIRED',
    );
  }

  const shouldReplaceAudio = mergeStrategy.audio === 'replace';
  const existingAudioPath = preview.existingWord.customAudioPath;
  const nextCustomAudioUrl = shouldReplaceAudio
    ? preview.incomingData.customAudioUrl
    : preview.existingWord.customAudioUrl;
  const nextCustomAudioPath = shouldReplaceAudio
    ? null
    : preview.existingWord.customAudioPath;

  const mergedWord = await prisma.word.update({
    where: { id: preview.existingWord.id },
    data: {
      translation:
        mergeStrategy.translation === 'replace'
          ? preview.incomingData.translation
          : preview.existingWord.translation,
      translationNormalized:
        mergeStrategy.translation === 'replace'
          ? preview.incomingData.translationNormalized
          : normalizeForLookup(preview.existingWord.translation),
      mandatoryTag: preview.existingWord.mandatoryTag,
      tags: mergeArrayValues(
        preview.existingWord.tags,
        preview.incomingData.tags,
        mergeStrategy.tags,
      ),
      synonyms: mergeArrayValues(
        preview.existingWord.synonyms,
        preview.incomingData.synonyms,
        mergeStrategy.synonyms,
      ),
      notesBlocks: toNullableJsonInput(
        mergeNotesBlocksValue(
          normalizeNotesBlocksForPersistence(preview.existingWord.notesBlocks),
          preview.incomingData.notesBlocks,
          mergeStrategy.notes,
        ),
      ),
      customAudioUrl: nextCustomAudioUrl,
      customAudioPath: nextCustomAudioPath,
      sourceWordId: preview.sourceWord.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
  });

  if (shouldReplaceAudio && existingAudioPath) {
    const supabase = await createClient();
    await deleteAudioFromStorage(supabase, existingAudioPath);
  }

  return {
    mode: 'merged' as const,
    word: toCommunityView(mergedWord, viewerId),
  };
};

export const importCommunityWordWithSelectionForUser = async (
  viewerId: string,
  sourceWordId: string,
  selection: CommunityImportSelection,
) => {
  const preview = await getCommunityWordImportPreview(viewerId, sourceWordId, {
    translation: true,
    tags: true,
    notes: true,
    synonyms: false,
    audio: true,
  });

  const sourceWord = preview.sourceWord;
  const existingWord = preview.existingWord;
  const mandatoryTag = sourceWord.mandatoryTag;

  const sourceCustomTags = sourceWord.tags.filter(
    (tag) => tag !== mandatoryTag,
  );
  const existingCustomTags = existingWord
    ? existingWord.tags.filter((tag) => tag !== mandatoryTag)
    : [];

  const selectedSourceTags = selectCustomTagsByLookup(
    sourceCustomTags,
    mandatoryTag,
    selection.communityTagKeys,
  );
  const selectedExistingTags = existingWord
    ? selectCustomTagsByLookup(
        existingCustomTags,
        mandatoryTag,
        selection.keepOwnTagKeys,
      )
    : [];

  const sourceNotesBlocks = normalizeNotesBlocksForPersistence(
    sourceWord.notesBlocks,
  );
  const existingNotesBlocks = existingWord
    ? normalizeNotesBlocksForPersistence(existingWord.notesBlocks)
    : null;

  const selectedSourceNotesBlocks = selectNotesBlocksById(
    sourceNotesBlocks,
    selection.communityNoteBlockIds,
  );
  const selectedExistingNotesBlocks = existingWord
    ? selectNotesBlocksById(existingNotesBlocks, selection.keepOwnNoteBlockIds)
    : [];

  const nextTranslation = existingWord
    ? selection.useCommunityTranslation
      ? sourceWord.translation
      : selection.keepOwnTranslation
        ? existingWord.translation
        : sourceWord.translation
    : sourceWord.translation;

  const mergedCustomTags = mergeTermsByNormalized(
    selectedExistingTags,
    selectedSourceTags,
  );
  const nextTags = [mandatoryTag, ...mergedCustomTags];

  const nextNotesBlocks = mergeSelectedNotesBlocks(
    selectedExistingNotesBlocks,
    selectedSourceNotesBlocks,
  );

  const nextCustomAudioUrl = existingWord
    ? selection.useCommunityAudio
      ? sourceWord.customAudioUrl
      : selection.keepOwnAudio
        ? existingWord.customAudioUrl
        : null
    : selection.useCommunityAudio
      ? sourceWord.customAudioUrl
      : null;

  if (!nextTranslation || normalizeText(nextTranslation).length === 0) {
    throw new ValidationError(
      'La traduction est obligatoire.',
      'INVALID_IMPORT_SELECTION',
    );
  }

  if (!nextTags.includes(mandatoryTag)) {
    throw new ValidationError(
      'La nature du mot est obligatoire.',
      'INVALID_IMPORT_SELECTION',
    );
  }

  if (!existingWord) {
    const created = await prisma.$transaction(async (tx) => {
      const word = await tx.word.create({
        data: {
          ownerId: viewerId,
          createdById: viewerId,
          sourceWordId: sourceWord.id,
          languageId: sourceWord.languageId,
          term: sourceWord.term,
          termNormalized: sourceWord.termNormalized,
          translation: nextTranslation,
          translationNormalized: normalizeForLookup(nextTranslation),
          mandatoryTag,
          tags: nextTags,
          synonyms: [],
          notesBlocks: toNullableJsonInput(nextNotesBlocks),
          customAudioUrl: nextCustomAudioUrl,
          customAudioPath: null,
          deleteToken: ACTIVE_DELETE_TOKEN,
        },
      });

      await tx.card.createMany({
        data: [
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.READING,
            type: ExerciseType.RECOGNITION,
          },
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.WRITING,
            type: ExerciseType.REVERSE,
          },
          {
            wordId: word.id,
            ownerId: viewerId,
            languageId: word.languageId,
            category: ExerciseCategory.WRITING,
            type: ExerciseType.SPELLING,
          },
        ],
      });

      return tx.word.findUnique({
        where: { id: word.id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              colorHex: true,
              username: true,
            },
          },
        },
      });
    });

    if (!created) {
      throw new NotFoundError('Impossible de finaliser la copie du mot.');
    }

    return {
      mode: 'created' as const,
      word: toCommunityView(created, viewerId),
    };
  }

  const shouldKeepOwnAudio =
    selection.keepOwnAudio && !selection.useCommunityAudio;
  const shouldRemoveOwnAudio =
    Boolean(existingWord.customAudioPath) && !shouldKeepOwnAudio;

  const mergedWord = await prisma.word.update({
    where: { id: existingWord.id },
    data: {
      translation: nextTranslation,
      translationNormalized: normalizeForLookup(nextTranslation),
      mandatoryTag,
      tags: nextTags,
      notesBlocks: toNullableJsonInput(nextNotesBlocks),
      customAudioUrl: nextCustomAudioUrl,
      customAudioPath: shouldKeepOwnAudio ? existingWord.customAudioPath : null,
      sourceWordId: sourceWord.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
          username: true,
        },
      },
    },
  });

  if (shouldRemoveOwnAudio) {
    const supabase = await createClient();
    await deleteAudioFromStorage(supabase, existingWord.customAudioPath!);
  }

  return {
    mode: 'merged' as const,
    word: toCommunityView(mergedWord, viewerId),
  };
};

export const updateWordForOwner = async (
  ownerId: string,
  wordId: string,
  input: WordInput,
  options?: {
    audioFile?: File | null;
    removeAudio?: boolean;
    supabase?: SupabaseClient;
  },
) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });
  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  const normalizedInput = buildInput({
    ...input,
    languageId: existingWord.languageId,
  });
  const sanitizedSynonyms = sanitizeSynonymsForTerm(
    normalizedInput.synonyms,
    normalizedInput.term,
  );
  const { notesBlocks, ...wordData } = normalizedInput;

  await assertNoActiveDuplicate(
    ownerId,
    existingWord.languageId,
    normalizedInput.termNormalized,
    normalizedInput.mandatoryTag,
    wordId,
  );

  let audioUpdateData:
    | { customAudioPath: string | null; customAudioUrl: string | null }
    | undefined;

  if (options?.audioFile && options.supabase && options.audioFile.size > 0) {
    const uploaded = await uploadAudio(
      options.supabase,
      ownerId,
      options.audioFile,
    );
    audioUpdateData = {
      customAudioPath: uploaded.customAudioPath,
      customAudioUrl: uploaded.customAudioUrl,
    };
  } else if (options?.removeAudio) {
    audioUpdateData = { customAudioPath: null, customAudioUrl: null };
  }

  const updatedWord = await prisma.$transaction(async (tx) => {
    const word = await tx.word.update({
      where: { id: wordId },
      data: {
        ...wordData,
        synonyms: sanitizedSynonyms,
        notesBlocks: toNullableJsonInput(notesBlocks),
        ...(audioUpdateData !== undefined ? audioUpdateData : {}),
      },
    });

    await synchronizeSynonymConnections(tx, {
      ownerId,
      languageId: existingWord.languageId,
      wordId: word.id,
      previousTerm: existingWord.term,
      nextTerm: word.term,
      previousSynonyms: existingWord.synonyms,
      nextSynonyms: word.synonyms,
    });

    return word;
  });

  const hasNewAudio = Boolean(options?.audioFile && options.audioFile.size > 0);
  const isExplicitlyRemoved = Boolean(options?.removeAudio);

  if (
    (hasNewAudio || isExplicitlyRemoved) &&
    options?.supabase &&
    existingWord.customAudioPath
  ) {
    await deleteAudioFromStorage(
      options.supabase,
      existingWord.customAudioPath,
    );
  }

  return updatedWord;
};

export const softDeleteWordForOwner = async (
  ownerId: string,
  wordId: string,
  supabase: SupabaseClient,
) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });

  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  const { now, purgeAfter } = retentionDate();
  const deleteToken = BigInt(now.getTime());

  if (existingWord.customAudioPath) {
    await deleteAudioFromStorage(supabase, existingWord.customAudioPath);
  }

  await prisma.word.update({
    where: { id: wordId },
    data: {
      isDeleted: true,
      deletedAt: now,
      purgeAfter,
      deleteToken,
      customAudioPath: null,
      customAudioUrl: null,
    },
  });
};

export const restoreWordForOwner = async (ownerId: string, wordId: string) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });

  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  await assertNoActiveDuplicate(
    ownerId,
    existingWord.languageId,
    existingWord.termNormalized,
    resolveMandatoryTag(existingWord.tags),
    wordId,
  );

  await prisma.word.update({
    where: { id: wordId },
    data: {
      isDeleted: false,
      deletedAt: null,
      purgeAfter: null,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
  });
};

export const hardDeleteWordForOwner = async (
  ownerId: string,
  wordId: string,
  supabase: SupabaseClient,
) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });

  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  if (existingWord.customAudioPath) {
    await deleteAudioFromStorage(supabase, existingWord.customAudioPath);
  }

  await prisma.word.delete({
    where: { id: wordId },
  });
};
