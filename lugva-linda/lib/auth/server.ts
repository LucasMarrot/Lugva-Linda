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

export const getSupabaseUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

export const requireAuthenticatedUser = async () => {
  const user = await getSupabaseUser();

  if (!user) {
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
  const user = await getSupabaseUser();

  if (!user) return null;

  try {
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        colorHex: true,
        activeLanguageId: true,
        role: true,
        targetOwnerId: true,
        lastContributorVisitAt: true,
        learningLanguages: {
          include: {
            language: true,
          },
        },
      },
    });

    if (!profile) {
      profile = await prisma.user.create({
        data: {
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
          targetOwnerId: true,
          lastContributorVisitAt: true,
          learningLanguages: {
            include: {
              language: true,
            },
          },
        },
      });
    }

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
        role: 'USER' as const,
        targetOwnerId: null,
        lastContributorVisitAt: null,
      };
    }
    throw dbError;
  }
});
