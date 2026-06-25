import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  ForbiddenError,
  isDatabaseUnavailableError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors';
import {
  assertUserLanguageAccess,
  ensureUserRecord,
} from '@/lib/services/language-service';
import { cache } from 'react';

export const requireAuthenticatedUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  await ensureUserRecord({ id: user.id, email: user.email });

  return user;
};

export const verifyLanguageOwnership = async (
  languageId: string,
  userId: string,
) => {
  const language = await prisma.language.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new NotFoundError('Langue introuvable.');
  }

  await assertUserLanguageAccess(userId, languageId);

  return language;
};

export const verifyWordOwnership = async (wordId: string, userId: string) => {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
  });

  if (!word) {
    throw new NotFoundError('Mot introuvable.');
  }

  if (word.ownerId !== userId) {
    throw new ForbiddenError('Accès refusé pour ce mot.');
  }

  return word;
};

export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  try {
    const profile = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email ?? `user-${user.id}@example.invalid`,
      },
      select: {
        id: true,
        email: true,
        username: true,
        colorHex: true,
        activeLanguageId: true,
        role: true,
        learningLanguages: {
          include: {
            language: true,
          },
        },
      },
    });

    return profile;
  } catch (dbError) {
    if (isDatabaseUnavailableError(dbError)) {
      console.warn(
        'Base de données injoignable, utilisation du profil de secours.',
      );
      return {
        id: user.id,
        email: user.email ?? '',
        username: null,
        colorHex: '#3B82F6',
        activeLanguageId: null,
        learningLanguages: [],
        role: 'USER',
      };
    }
    throw dbError;
  }
});
