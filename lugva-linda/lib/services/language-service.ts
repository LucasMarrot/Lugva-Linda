import prisma from '@/lib/prisma';
import { ForbiddenError } from '@/lib/errors';
import { normalizeForLookup } from '@/lib/words/normalization';

export const ensureUserRecord = async (user: {
  id: string;
  email?: string | null;
}) => {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      ...(user.email ? { email: user.email } : {}),
    },
    create: {
      id: user.id,
      email: user.email ?? `user-${user.id}@example.invalid`,
    },
  });
};

export const listUserLanguages = async (userId: string) => {
  const links = await prisma.userLanguage.findMany({
    where: { userId },
    include: { language: true },
    orderBy: { createdAt: 'asc' },
  });

  return links.map((link) => link.language);
};

export const getFirstUserLanguage = async (userId: string) => {
  const first = await prisma.userLanguage.findFirst({
    where: { userId },
    include: { language: true },
    orderBy: { createdAt: 'asc' },
  });

  return first?.language ?? null;
};

export const assertUserLanguageAccess = async (
  userId: string,
  languageId: string,
) => {
  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_languageId: {
        userId,
        languageId,
      },
    },
  });

  if (!userLanguage) {
    throw new ForbiddenError('Acces refuse pour cette langue.');
  }

  return userLanguage;
};

export const createLanguageForUser = async (
  user: { id: string; email?: string | null },
  name: string,
) => {
  await ensureUserRecord(user);

  const normalizedName = normalizeForLookup(name);

  return prisma.$transaction(async (tx) => {
    let language = await tx.language.findUnique({
      where: { nameNorm: normalizedName },
    });

    if (!language) {
      language = await tx.language.create({
        data: {
          name,
          nameNorm: normalizedName,
          code: name.substring(0, 2).toUpperCase(),
          createdBy: user.id,
        },
      });
    }

    await tx.userLanguage.upsert({
      where: {
        userId_languageId: {
          userId: user.id,
          languageId: language.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        languageId: language.id,
      },
    });

    return language;
  });
};
