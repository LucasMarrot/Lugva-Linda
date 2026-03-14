'use server';

import {
  requireAuthenticatedUser,
  verifyLanguageOwnership,
  verifyWordOwnership,
} from '@/lib/auth/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  languageIdSchema,
  nonEmptyTextSchema,
  wordIdSchema,
} from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

const normalizeText = (value: string) => value.normalize('NFC').trim();

const getNormalizedStringArray = (values: FormDataEntryValue[]) => {
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 0);
};

export async function createWord(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  const word = nonEmptyTextSchema.parse(
    normalizeText(String(formData.get('word') ?? '')),
  );
  const translation = nonEmptyTextSchema.parse(
    normalizeText(String(formData.get('translation') ?? '')),
  );
  const tags = getNormalizedStringArray(formData.getAll('tags'));
  const synonyms = getNormalizedStringArray(formData.getAll('synonyms'));

  const audioFile = formData.get('audioFile') as File | null;
  let customAudioUrl: string | null = null;

  if (audioFile && audioFile.size > 0) {
    const fileExtension = audioFile.name.split('.').pop() || 'webm';
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error("Impossible de sauvegarder l'audio");

    const {
      data: { publicUrl },
    } = supabase.storage.from('audio-files').getPublicUrl(fileName);
    customAudioUrl = publicUrl;
  }

  const languageIdEntry = formData.get('languageId');
  let languageId =
    typeof languageIdEntry === 'string' ? normalizeText(languageIdEntry) : '';

  if (!languageId) {
    const firstLang = await prisma.language.findFirst({
      where: { userId: user.id },
    });
    if (!firstLang) throw new Error('Aucune langue trouvée');
    languageId = firstLang.id;
  } else {
    const parsedLanguageId = languageIdSchema.parse(languageId);
    await verifyLanguageOwnership(parsedLanguageId, user.id);
    languageId = parsedLanguageId;
  }

  await prisma.word.create({
    data: {
      word,
      translation,
      tags,
      synonyms,
      customAudio: customAudioUrl,
      languageId,
      userId: user.id,
    },
  });

  if (synonyms.length > 0) {
    const existingSynonyms = await prisma.word.findMany({
      where: {
        userId: user.id,
        languageId: languageId,
        word: { in: synonyms, mode: 'insensitive' },
      },
    });

    for (const existing of existingSynonyms) {
      if (!existing.synonyms.includes(word)) {
        await prisma.word.update({
          where: { id: existing.id },
          data: { synonyms: { push: word } },
        });
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/words');
}

export async function searchWords(query: string, languageId: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const user = await requireAuthenticatedUser();

  let activeLangId = normalizeText(languageId);
  if (!activeLangId) {
    const firstLang = await prisma.language.findFirst({
      where: { userId: user.id },
    });
    if (!firstLang) return [];
    activeLangId = firstLang.id;
  } else {
    const parsedLanguageId = languageIdSchema.parse(activeLangId);
    await verifyLanguageOwnership(parsedLanguageId, user.id);
    activeLangId = parsedLanguageId;
  }

  const words = await prisma.word.findMany({
    where: {
      userId: user.id,
      languageId: activeLangId,
      OR: [
        { word: { contains: normalizedQuery, mode: 'insensitive' } },
        { translation: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: {
      word: 'asc',
    },
  });

  return words;
}

export async function getWordByTextAction(text: string, languageId: string) {
  const user = await requireAuthenticatedUser();
  const validatedLanguageId = languageIdSchema.parse(normalizeText(languageId));
  await verifyLanguageOwnership(validatedLanguageId, user.id);

  const word = await prisma.word.findFirst({
    where: {
      userId: user.id,
      languageId: validatedLanguageId,
      word: {
        equals: normalizeText(text),
        mode: 'insensitive',
      },
    },
  });

  return word;
}

export async function deleteWordAction(wordId: string) {
  const user = await requireAuthenticatedUser();
  const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
  await verifyWordOwnership(validatedWordId, user.id);

  await prisma.word.delete({
    where: { id: validatedWordId },
  });

  revalidatePath('/');
  revalidatePath('/words');
}

export async function updateWordAction(wordId: string, formData: FormData) {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
  const word = nonEmptyTextSchema.parse(
    normalizeText(String(formData.get('word') ?? '')),
  );
  const translation = nonEmptyTextSchema.parse(
    normalizeText(String(formData.get('translation') ?? '')),
  );
  const tags = getNormalizedStringArray(formData.getAll('tags'));
  const synonyms = getNormalizedStringArray(formData.getAll('synonyms'));

  const audioFile = formData.get('audioFile') as File | null;
  let customAudioUrl: string | undefined = undefined;

  if (audioFile && audioFile.size > 0) {
    const fileExtension = audioFile.name.split('.').pop() || 'webm';
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error("Impossible de sauvegarder l'audio");

    const {
      data: { publicUrl },
    } = supabase.storage.from('audio-files').getPublicUrl(fileName);
    customAudioUrl = publicUrl;
  }

  await verifyWordOwnership(validatedWordId, user.id);

  await prisma.word.update({
    where: { id: validatedWordId },
    data: {
      word,
      translation,
      tags,
      synonyms,
      ...(customAudioUrl !== undefined && { customAudio: customAudioUrl }),
    },
  });

  revalidatePath('/');
  revalidatePath('/words');
}
