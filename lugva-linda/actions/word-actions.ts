'use server';

import {
  requireAuthenticatedUser,
  verifyLanguageOwnership,
} from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import {
  communityImportSelectionSchema,
  checkWordTermNatureSchema,
  languageIdSchema,
  wordIdSchema,
  CommunityImportSelection,
} from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import {
  checkWordTermNatureDuplicateForOwner,
  createWordForUser,
  findWordByTermForOwner,
  getCommunityWordImportPreview,
  hardDeleteWordForOwner,
  importCommunityWordForUser,
  importCommunityWordWithSelectionForUser,
  listCustomTagsForOwnerInLanguage,
  listCommunityMembers,
  listMemberWordsInLanguage,
  parseWordFormData,
  restoreWordForOwner,
  searchWordsInLanguage,
  softDeleteWordForOwner,
  updateWordForOwner,
} from '@/lib/services/word-service';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { normalizeText } from '@/lib/words/normalization';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';
import {
  defaultCopyFieldOptions,
  defaultWordMergeStrategy,
  type CopyFieldOptions,
  type WordMergeStrategy,
} from '@/lib/words/community';

const parseCopyOptions = (
  input?: Partial<CopyFieldOptions>,
): CopyFieldOptions => ({
  translation: input?.translation ?? defaultCopyFieldOptions.translation,
  tags: input?.tags ?? defaultCopyFieldOptions.tags,
  notes: input?.notes ?? defaultCopyFieldOptions.notes,
  synonyms: input?.synonyms ?? defaultCopyFieldOptions.synonyms,
  audio: input?.audio ?? defaultCopyFieldOptions.audio,
});

const parseMergeStrategy = (
  input?: Partial<WordMergeStrategy>,
): WordMergeStrategy => ({
  translation: input?.translation ?? defaultWordMergeStrategy.translation,
  tags: input?.tags ?? defaultWordMergeStrategy.tags,
  notes: input?.notes ?? defaultWordMergeStrategy.notes,
  synonyms: input?.synonyms ?? defaultWordMergeStrategy.synonyms,
  audio: input?.audio ?? defaultWordMergeStrategy.audio,
});

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

export async function checkWordTermNatureAvailabilityAction(input: {
  word: string;
  languageId: string;
  mandatoryTag: string;
  excludeWordId?: string;
}) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    assertRateLimit(`check-word-term-nature:${user.id}`, 120, 60_000);

    const parsed = checkWordTermNatureSchema.parse({
      word: normalizeText(input.word),
      languageId: languageIdSchema.parse(normalizeText(input.languageId)),
      mandatoryTag: normalizeText(input.mandatoryTag),
      excludeWordId: input.excludeWordId
        ? wordIdSchema.parse(normalizeText(input.excludeWordId))
        : undefined,
    });

    await verifyLanguageOwnership(parsed.languageId, user.id);

    const isDuplicate = await checkWordTermNatureDuplicateForOwner(
      user.id,
      parsed.languageId,
      parsed.word,
      parsed.mandatoryTag,
      parsed.excludeWordId,
    );

    return {
      isDuplicate,
      message: isDuplicate ? 'Ce mot existe deja avec cette nature.' : null,
    };
  } catch (error) {
    logActionError('checkWordTermNatureAvailabilityAction', userId, error);
    throw toActionError(error);
  }
}

export async function searchWords(query: string, languageId: string) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const requestedLanguageId = normalizeText(languageId);
    if (requestedLanguageId) {
      const parsedLanguageId = languageIdSchema.parse(requestedLanguageId);
      await verifyLanguageOwnership(parsedLanguageId, user.id);
      return searchWordsInLanguage(user.id, parsedLanguageId, query);
    }

    const { activeLanguageId } = await resolveActiveLanguageForUser(user.id);
    if (!activeLanguageId) return [];

    return searchWordsInLanguage(user.id, activeLanguageId, query);
  } catch (error) {
    logActionError('searchWords', userId, error);
    throw toActionError(error);
  }
}

export async function listCustomTagsAction(languageId: string) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const requestedLanguageId = normalizeText(languageId);
    if (requestedLanguageId) {
      const parsedLanguageId = languageIdSchema.parse(requestedLanguageId);
      await verifyLanguageOwnership(parsedLanguageId, user.id);
      return listCustomTagsForOwnerInLanguage(user.id, parsedLanguageId);
    }

    const { activeLanguageId } = await resolveActiveLanguageForUser(user.id);
    if (!activeLanguageId) return [];

    return listCustomTagsForOwnerInLanguage(user.id, activeLanguageId);
  } catch (error) {
    logActionError('listCustomTagsAction', userId, error);
    throw toActionError(error);
  }
}

export async function listCommunityMembersAction() {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const members = await listCommunityMembers();
    return members.filter((member) => member.id !== user.id);
  } catch (error) {
    logActionError('listCommunityMembersAction', userId, error);
    throw toActionError(error);
  }
}

export async function listMemberWordsAction(
  memberId: string,
  languageId: string,
  query?: string,
) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const validatedLanguageId = languageIdSchema.parse(
      normalizeText(languageId),
    );
    await verifyLanguageOwnership(validatedLanguageId, user.id);

    return listMemberWordsInLanguage(
      user.id,
      wordIdSchema.parse(normalizeText(memberId)),
      validatedLanguageId,
      query,
    );
  } catch (error) {
    logActionError('listMemberWordsAction', userId, error);
    throw toActionError(error);
  }
}

export async function previewWordImportAction(
  sourceWordId: string,
  options?: Partial<CopyFieldOptions>,
) {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    return getCommunityWordImportPreview(
      user.id,
      wordIdSchema.parse(normalizeText(sourceWordId)),
      parseCopyOptions(options),
    );
  } catch (error) {
    logActionError('previewWordImportAction', userId, error);
    throw toActionError(error);
  }
}

export async function importWordFromCommunityAction(
  sourceWordId: string,
  options?: Partial<CopyFieldOptions>,
  mergeStrategy?: Partial<WordMergeStrategy>,
) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`import-word:${user.id}`, 25, 60_000);

    const result = await importCommunityWordForUser(
      user.id,
      wordIdSchema.parse(normalizeText(sourceWordId)),
      parseCopyOptions(options),
      mergeStrategy ? parseMergeStrategy(mergeStrategy) : undefined,
    );

    revalidatePath('/');
    revalidatePath('/words');
    revalidatePath('/community');
    logActionSuccess('importWordFromCommunityAction', userId, startedAt);

    return result;
  } catch (error) {
    logActionError('importWordFromCommunityAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function importWordFromCommunitySelectionAction(
  sourceWordId: string,
  selection: CommunityImportSelection,
) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`import-word-selection:${user.id}`, 25, 60_000);

    const validatedSelection = communityImportSelectionSchema.parse(selection);
    const result = await importCommunityWordWithSelectionForUser(
      user.id,
      wordIdSchema.parse(normalizeText(sourceWordId)),
      validatedSelection,
    );

    revalidatePath('/');
    revalidatePath('/words');
    revalidatePath('/community');
    logActionSuccess(
      'importWordFromCommunitySelectionAction',
      userId,
      startedAt,
    );

    return result;
  } catch (error) {
    logActionError(
      'importWordFromCommunitySelectionAction',
      userId,
      error,
      startedAt,
    );
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
    const supabase = await createClient();

    const validatedWordId = wordIdSchema.parse(normalizeText(wordId));
    await softDeleteWordForOwner(user.id, validatedWordId, supabase);

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
