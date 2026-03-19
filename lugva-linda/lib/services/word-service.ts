import type { SupabaseClient } from '@supabase/supabase-js';
import { ExerciseCategory, ExerciseType } from '@prisma/client';

import prisma from '@/lib/prisma';
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
      deleteToken: BigInt(0),
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
        deleteToken: BigInt(0),
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
          deleteToken: BigInt(0),
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
  languageId: string,
  query: string,
) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return prisma.word.findMany({
    where: {
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
      OR: [
        { term: { contains: normalizedQuery, mode: 'insensitive' } },
        { translation: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: {
      term: 'asc',
    },
  });
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
      deleteToken: BigInt(0),
    },
  });
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
      deleteToken: BigInt(0),
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
