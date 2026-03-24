'use server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  createLanguageFormSchema,
  languageIdSchema,
} from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import {
  createLanguageForUser,
  listGlobalLanguages,
  setActiveLanguageForUser,
} from '@/lib/services/language-service';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { DuplicateError } from '@/lib/errors';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';

export async function createLanguage(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      formData,
      subject: user.id,
    });
    assertRateLimit(`create-language:${user.id}`, 10, 60_000);

    const parsedForm = createLanguageFormSchema.parse({
      name: String(formData.get('name') ?? ''),
    });

    const existingLanguages = await listGlobalLanguages();
    const hasExistingLanguage = existingLanguages.some(
      (language) =>
        language.name.localeCompare(parsedForm.name, undefined, {
          sensitivity: 'accent',
        }) === 0,
    );

    if (hasExistingLanguage) {
      throw new DuplicateError("La langue existe deja dans l'application.");
    }

    await createLanguageForUser(user, parsedForm.name);

    revalidatePath('/');
    logActionSuccess('createLanguage', userId, startedAt);
  } catch (error) {
    logActionError('createLanguage', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function setActiveLanguage(languageId: string) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`set-active-language:${user.id}`, 120, 60_000);

    const validatedLanguageId = languageIdSchema.parse(languageId.trim());
    await setActiveLanguageForUser(user.id, validatedLanguageId);

    revalidatePath('/');
    revalidatePath('/words');
    revalidatePath('/review');
    logActionSuccess('setActiveLanguage', userId, startedAt);
  } catch (error) {
    logActionError('setActiveLanguage', userId, error, startedAt);
    throw toActionError(error);
  }
}
