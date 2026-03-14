import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/lib/errors';

export const requireAuthenticatedUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

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

  if (language.userId !== userId) {
    throw new ForbiddenError('Acces refuse pour cette langue.');
  }

  return language;
};

export const verifyWordOwnership = async (wordId: string, userId: string) => {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
  });

  if (!word) {
    throw new NotFoundError('Mot introuvable.');
  }

  if (word.userId !== userId) {
    throw new ForbiddenError('Acces refuse pour ce mot.');
  }

  return word;
};
