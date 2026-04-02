import type { SupabaseClient } from '@supabase/supabase-js';
import { ExerciseCategory, ExerciseType } from '@prisma/client';

import prisma from '@/lib/prisma';
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
import { wordWriteSchema } from '@/lib/validation/schemas';
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
  mergeArrayValues,
  mergeNotesValue,
  scoreSearchResult,
} from '@/lib/services/community-merge';

const AUDIO_BUCKET = 'audio-files';
const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
const AUDIO_ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
]);
const TRASH_RETENTION_DAYS = 30;

type WordInput = {
  term: string;
  translation: string;
  tags: string[];
  synonyms: string[];
  relatedWords: string[];
  notes: string | null;
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
  if (file.type === 'audio/mp4') return 'm4a';
  if (file.type === 'audio/ogg') return 'ogg';
  if (file.type === 'audio/wav') return 'wav';
  return 'webm';
};

const validateAudioFile = (file: File) => {
  if (!AUDIO_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ValidationError(
      'Format audio non supporte.',
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

const buildInput = (input: WordInput) => {
  const term = normalizeText(input.term);
  const translation = normalizeText(input.translation);

  const parsedInput = wordWriteSchema.parse({
    term,
    translation,
    tags: input.tags,
    synonyms: input.synonyms,
    relatedWords: input.relatedWords,
    notes: input.notes,
    languageId: input.languageId,
  });

  return {
    term: parsedInput.term,
    termNormalized: normalizeForLookup(term),
    translation: parsedInput.translation,
    translationNormalized: normalizeForLookup(translation),
    tags: parsedInput.tags,
    synonyms: parsedInput.synonyms,
    relatedWords: parsedInput.relatedWords,
    notes: parsedInput.notes,
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
    displayName: toDisplayName(word.owner.email, word.owner.id),
  },
  isOwnedByCurrentUser: word.ownerId === viewerId,
});

const assertNoActiveDuplicate = async (
  ownerId: string,
  languageId: string,
  termNormalized: string,
  excludeWordId?: string,
) => {
  const duplicate = await prisma.word.findFirst({
    where: {
      ownerId,
      languageId,
      termNormalized,
      deleteToken: ACTIVE_DELETE_TOKEN,
      ...(excludeWordId ? { id: { not: excludeWordId } } : {}),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new DuplicateError('Ce terme existe deja dans votre encyclopedie.');
  }
};

export const parseWordFormData = (formData: FormData): WordInput => ({
  term: String(formData.get('word') ?? formData.get('term') ?? ''),
  translation: String(formData.get('translation') ?? ''),
  tags: normalizeFormStringArray(formData.getAll('tags')),
  synonyms: normalizeFormStringArray(formData.getAll('synonyms')),
  relatedWords: normalizeFormStringArray(formData.getAll('relatedWords')),
  notes: normalizeText(String(formData.get('notes') ?? '')) || null,
  languageId:
    normalizeText(String(formData.get('languageId') ?? '')) || undefined,
});

export const createWordForUser = async (
  userId: string,
  input: WordInput,
  options?: { audioFile?: File | null; supabase?: SupabaseClient },
) => {
  const languageId = await resolveLanguageId(userId, input.languageId);
  const normalizedInput = buildInput(input);

  await assertNoActiveDuplicate(
    userId,
    languageId,
    normalizedInput.termNormalized,
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
        ...normalizedInput,
        deleteToken: ACTIVE_DELETE_TOKEN,
        ...(audioData ?? {}),
      },
    });

    await tx.card.create({
      data: {
        wordId: word.id,
        ownerId: userId,
        languageId,
        category: ExerciseCategory.READING,
        type: ExerciseType.RECOGNITION,
      },
    });

    if (normalizedInput.synonyms.length > 0) {
      const existing = await tx.word.findMany({
        where: {
          ownerId: userId,
          languageId,
          termNormalized: {
            in: normalizedInput.synonyms.map((item) =>
              normalizeForLookup(item),
            ),
          },
          deleteToken: ACTIVE_DELETE_TOKEN,
          isDeleted: false,
        },
      });

      for (const relatedWord of existing) {
        if (!relatedWord.synonyms.includes(normalizedInput.term)) {
          await tx.word.update({
            where: { id: relatedWord.id },
            data: { synonyms: { push: normalizedInput.term } },
          });
        }
      }
    }

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
        { notes: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
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
  tags: options.tags ? sourceWord.tags : [],
  synonyms: options.synonyms ? sourceWord.synonyms : [],
  notes: options.notes ? sourceWord.notes : null,
  customAudioUrl: options.audio ? sourceWord.customAudioUrl : null,
});

export const listCommunityMembers = async (): Promise<
  CommunityMemberSummary[]
> => {
  const members = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      colorHex: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
  });

  return members.map((member) => ({
    id: member.id,
    email: member.email,
    colorHex: member.colorHex,
    displayName: toDisplayName(member.email, member.id),
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
      isDeleted: false,
      deleteToken: ACTIVE_DELETE_TOKEN,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
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
          tags: preview.incomingData.tags,
          synonyms: preview.incomingData.synonyms,
          notes: preview.incomingData.notes,
          customAudioUrl: preview.incomingData.customAudioUrl,
          customAudioPath: null,
          deleteToken: ACTIVE_DELETE_TOKEN,
        },
      });

      await tx.card.create({
        data: {
          wordId: word.id,
          ownerId: viewerId,
          languageId: word.languageId,
          category: ExerciseCategory.READING,
          type: ExerciseType.RECOGNITION,
        },
      });

      return findWordWithOwnerById(word.id);
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
      notes: mergeNotesValue(
        preview.existingWord.notes,
        preview.incomingData.notes,
        mergeStrategy.notes,
      ),
      customAudioUrl:
        mergeStrategy.audio === 'replace'
          ? preview.incomingData.customAudioUrl
          : preview.existingWord.customAudioUrl,
      sourceWordId: preview.sourceWord.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          colorHex: true,
        },
      },
    },
  });

  return {
    mode: 'merged' as const,
    word: toCommunityView(mergedWord, viewerId),
  };
};

export const updateWordForOwner = async (
  ownerId: string,
  wordId: string,
  input: WordInput,
  options?: { audioFile?: File | null; supabase?: SupabaseClient },
) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });
  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  const normalizedInput = buildInput({
    ...input,
    languageId: existingWord.languageId,
  });
  await assertNoActiveDuplicate(
    ownerId,
    existingWord.languageId,
    normalizedInput.termNormalized,
    wordId,
  );

  let audioData:
    | { customAudioPath: string; customAudioUrl: string }
    | undefined;
  if (options?.audioFile && options.supabase && options.audioFile.size > 0) {
    audioData = await uploadAudio(options.supabase, ownerId, options.audioFile);
  }

  return prisma.word.update({
    where: { id: wordId },
    data: {
      ...normalizedInput,
      ...(audioData ?? {}),
    },
  });
};

export const softDeleteWordForOwner = async (
  ownerId: string,
  wordId: string,
) => {
  const existingWord = await prisma.word.findUnique({ where: { id: wordId } });

  if (!existingWord || existingWord.ownerId !== ownerId) {
    throw new NotFoundError('Mot introuvable.');
  }

  const { now, purgeAfter } = retentionDate();
  const deleteToken = BigInt(now.getTime());

  await prisma.word.update({
    where: { id: wordId },
    data: {
      isDeleted: true,
      deletedAt: now,
      purgeAfter,
      deleteToken,
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
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([existingWord.customAudioPath]);

    if (error) {
      throw new StorageError('Suppression audio impossible. Reessayez.');
    }
  }

  await prisma.word.delete({
    where: { id: wordId },
  });
};
