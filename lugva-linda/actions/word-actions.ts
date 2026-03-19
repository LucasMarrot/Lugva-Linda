'use server';

import {
  requireAuthenticatedUser,
  verifyLanguageOwnership,
} from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { languageIdSchema, wordIdSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import {
  createWordForUser,
  findWordByTermForOwner,
  hardDeleteWordForOwner,
  parseWordFormData,
  restoreWordForOwner,
  searchWordsInLanguage,
  softDeleteWordForOwner,
  updateWordForOwner,
} from '@/lib/services/word-service';
import { getFirstUserLanguage } from '@/lib/services/language-service';
import { normalizeText } from '@/lib/words/normalization';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';

export async function createWord(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      formData,
      subject: user.id,
    });
    assertRateLimit(`create-word:${user.id}`, 30, 60_000);
    const supabase = await createClient();

    const input = parseWordFormData(formData);
    const audioFile = formData.get('audioFile') as File | null;

    await createWordForUser(user.id, input, {
      audioFile,
      supabase,
    });

    revalidatePath('/');
    revalidatePath('/words');
    logActionSuccess('createWord', userId, startedAt);
  } catch (error) {
    logActionError('createWord', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function searchWords(query: string, languageId: string) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    let activeLanguageId = normalizeText(languageId);
    if (!activeLanguageId) {
      const firstLanguage = await getFirstUserLanguage(user.id);
      if (!firstLanguage) return [];
      activeLanguageId = firstLanguage.id;
    } else {
      const parsedLanguageId = languageIdSchema.parse(activeLanguageId);
      await verifyLanguageOwnership(parsedLanguageId, user.id);
      activeLanguageId = parsedLanguageId;
    }

    return searchWordsInLanguage(activeLanguageId, query);
  } catch (error) {
    logActionError('searchWords', userId, error);
    throw toActionError(error);
  }
}

export async function getWordByTextAction(text: string, languageId: string) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const validatedLanguageId = languageIdSchema.parse(
      normalizeText(languageId),
    );
    await verifyLanguageOwnership(validatedLanguageId, user.id);

    return findWordByTermForOwner(user.id, validatedLanguageId, text);
  } catch (error) {
    logActionError('getWordByTextAction', userId, error);
    throw toActionError(error);
  }
}

export async function deleteWordAction(wordId: string) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`delete-word:${user.id}`, 30, 60_000);

    const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
    await softDeleteWordForOwner(user.id, validatedWordId);

    revalidatePath('/');
    revalidatePath('/words');
    logActionSuccess('deleteWordAction', userId, startedAt);
  } catch (error) {
    logActionError('deleteWordAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function updateWordAction(wordId: string, formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      formData,
      subject: user.id,
    });
    assertRateLimit(`update-word:${user.id}`, 40, 60_000);
    const supabase = await createClient();

    const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
    const input = parseWordFormData(formData);
    const audioFile = formData.get('audioFile') as File | null;

    await updateWordForOwner(user.id, validatedWordId, input, {
      audioFile,
      supabase,
    });

    revalidatePath('/');
    revalidatePath('/words');
    logActionSuccess('updateWordAction', userId, startedAt);
  } catch (error) {
    logActionError('updateWordAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function restoreWordAction(wordId: string) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`restore-word:${user.id}`, 30, 60_000);

    const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
    await restoreWordForOwner(user.id, validatedWordId);

    revalidatePath('/');
    revalidatePath('/words');
    logActionSuccess('restoreWordAction', userId, startedAt);
  } catch (error) {
    logActionError('restoreWordAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function hardDeleteWordAction(wordId: string) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`hard-delete-word:${user.id}`, 15, 60_000);
    const supabase = await createClient();

    const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
    await hardDeleteWordForOwner(user.id, validatedWordId, supabase);

    revalidatePath('/');
    revalidatePath('/words');
    logActionSuccess('hardDeleteWordAction', userId, startedAt);
  } catch (error) {
    logActionError('hardDeleteWordAction', userId, error, startedAt);
    throw toActionError(error);
  }
}
