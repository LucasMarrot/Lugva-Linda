'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';
import {
  userColorSchema,
  userEmailSchema,
  userPasswordSchema,
  usernameSchema,
} from '@/lib/validation/schemas';
import { DuplicateError, ValidationError } from '@/lib/errors';

export async function updateUsername(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({ formData, subject: user.id });
    assertRateLimit(`update-username:${user.id}`, 20, 60_000);

    const parsedUsername = usernameSchema.parse(
      String(formData.get('username') ?? ''),
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { username: parsedUsername },
    });

    revalidatePath('/settings');
    revalidatePath('/community');
    revalidatePath('/', 'layout');
    logActionSuccess('updateUsername', userId, startedAt);
  } catch (error) {
    logActionError('updateUsername', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function updateEmail(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({ formData, subject: user.id });
    assertRateLimit(`update-email:${user.id}`, 8, 60_000);

    const parsedEmail = userEmailSchema.parse(
      String(formData.get('email') ?? ''),
    );

    const existing = await prisma.user.findUnique({
      where: { email: parsedEmail },
      select: { id: true },
    });

    if (existing && existing.id !== user.id) {
      throw new DuplicateError('Cet email est deja utilise.');
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      email: parsedEmail,
    });

    if (error) {
      throw new ValidationError(
        error.message || "Impossible de mettre a jour l'email.",
        'EMAIL_UPDATE_FAILED',
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: parsedEmail },
    });

    revalidatePath('/settings');
    revalidatePath('/community');
    revalidatePath('/', 'layout');
    logActionSuccess('updateEmail', userId, startedAt);
  } catch (error) {
    logActionError('updateEmail', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function updatePassword(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({ formData, subject: user.id });
    assertRateLimit(`update-password:${user.id}`, 6, 60_000);

    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    const parsedPassword = userPasswordSchema.parse(password);
    const parsedConfirm = userPasswordSchema.parse(confirmPassword);

    if (parsedPassword !== parsedConfirm) {
      throw new ValidationError('Les mots de passe ne correspondent pas.');
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsedPassword,
    });

    if (error) {
      throw new ValidationError(
        error.message || 'Impossible de mettre a jour le mot de passe.',
        'PASSWORD_UPDATE_FAILED',
      );
    }

    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    logActionSuccess('updatePassword', userId, startedAt);
  } catch (error) {
    logActionError('updatePassword', userId, error, startedAt);
    throw toActionError(error);
  }
}

export async function updateUserColor(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;
    await assertCsrfForAction({ formData, subject: user.id });
    assertRateLimit(`update-user-color:${user.id}`, 20, 60_000);

    const parsedColor = userColorSchema.parse(
      String(formData.get('colorHex') ?? ''),
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { colorHex: parsedColor },
    });

    revalidatePath('/settings');
    revalidatePath('/community');
    revalidatePath('/', 'layout');
    logActionSuccess('updateUserColor', userId, startedAt);
  } catch (error) {
    logActionError('updateUserColor', userId, error, startedAt);
    throw toActionError(error);
  }
}
