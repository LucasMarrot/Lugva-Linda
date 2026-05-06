'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
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
import { redirect } from 'next/navigation';

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

    const oldPassword = String(formData.get('oldPassword') ?? '');
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (!oldPassword) {
      throw new ValidationError('Le mot de passe actuel est requis.');
    }

    const parsedPassword = userPasswordSchema.parse(password);
    const parsedConfirm = userPasswordSchema.parse(confirmPassword);

    if (parsedPassword !== parsedConfirm) {
      throw new ValidationError('Les mots de passe ne correspondent pas.');
    }

    const supabase = await createClient();

    if (!user.email) {
      throw new ValidationError(
        "Impossible de vérifier l'utilisateur (email manquant).",
      );
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      throw new ValidationError('Le mot de passe actuel est incorrect.');
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsedPassword,
    });

    if (updateError) {
      throw new ValidationError(
        updateError.message || 'Impossible de mettre a jour le mot de passe.',
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

export async function deleteAccountAction() {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    await assertCsrfForAction({ subject: user.id });
    assertRateLimit(`delete-account:${user.id}`, 3, 60_000);

    const supabaseAdmin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await prisma.user.delete({
      where: { id: user.id },
    });

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      throw new ValidationError(
        "Erreur lors de la suppression de l'identité d'authentification.",
      );
    }

    const supabase = await createClient();
    await supabase.auth.signOut();

    logActionSuccess('deleteAccountAction', userId, startedAt);
  } catch (error) {
    logActionError('deleteAccountAction', userId, error, startedAt);
    throw toActionError(error);
  }

  redirect('/auth/login');
}
