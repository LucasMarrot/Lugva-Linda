import prisma from '@/lib/prisma';
import { ForbiddenError } from '@/lib/errors';
import { normalizeForLookup } from '@/lib/words/normalization';

type UserRecordInput = {
  id: string;
  email?: string | null;
};

type ResolveActiveLanguageResult = {
  languages: Awaited<ReturnType<typeof listUserLanguages>>;
  activeLanguageId: string | null;
};

const toUserRecord = (userOrId: string | UserRecordInput): UserRecordInput =>
  typeof userOrId === 'string' ? { id: userOrId } : userOrId;

export const ensureUserRecord = async (user: UserRecordInput) => {
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

export const syncGlobalLanguagesForUser = async (user: UserRecordInput) => {
  await ensureUserRecord(user);

  const [globalLanguages, userLinks] = await Promise.all([
    prisma.language.findMany({
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
    }),
    prisma.userLanguage.findMany({
      where: { userId: user.id },
      select: { languageId: true },
    }),
  ]);

  if (globalLanguages.length === 0) {
    return;
  }

  const existingLanguageIds = new Set(userLinks.map((link) => link.languageId));
  const missingLinks = globalLanguages
    .map((language) => language.id)
    .filter((languageId) => !existingLanguageIds.has(languageId));

  if (missingLinks.length > 0) {
    await prisma.userLanguage.createMany({
      data: missingLinks.map((languageId) => ({
        userId: user.id,
        languageId,
      })),
      skipDuplicates: true,
    });
  }

  await ensureActiveLanguageForUser(user.id);
};

export const listGlobalLanguages = async () =>
  prisma.language.findMany({
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  });

export const listUserLanguages = async (userOrId: string | UserRecordInput) => {
  const user = toUserRecord(userOrId);
  await syncGlobalLanguagesForUser(user);

  const links = await prisma.userLanguage.findMany({
    where: { userId: user.id },
    include: { language: true },
    orderBy: [{ language: { createdAt: 'asc' } }, { createdAt: 'asc' }],
  });

  return links.map((link) => link.language);
};

export const getFirstUserLanguage = async (
  userOrId: string | UserRecordInput,
) => {
  const user = toUserRecord(userOrId);
  await syncGlobalLanguagesForUser(user);

  const first = await prisma.userLanguage.findFirst({
    where: { userId: user.id },
    include: { language: true },
    orderBy: [{ language: { createdAt: 'asc' } }, { createdAt: 'asc' }],
  });

  return first?.language ?? null;
};

const ensureActiveLanguageForUser = async (userId: string) => {
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeLanguageId: true },
  });

  const firstLinkedLanguage = await prisma.userLanguage.findFirst({
    where: { userId },
    select: { languageId: true },
    orderBy: [{ createdAt: 'asc' }],
  });

  if (!firstLinkedLanguage) {
    if (userRecord?.activeLanguageId) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeLanguageId: null },
      });
    }
    return null;
  }

  if (userRecord?.activeLanguageId) {
    const activeLink = await prisma.userLanguage.findUnique({
      where: {
        userId_languageId: {
          userId,
          languageId: userRecord.activeLanguageId,
        },
      },
      select: { languageId: true },
    });

    if (activeLink) {
      return activeLink.languageId;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeLanguageId: firstLinkedLanguage.languageId },
  });

  return firstLinkedLanguage.languageId;
};

export const setActiveLanguageForUser = async (
  userId: string,
  languageId: string,
) => {
  await assertUserLanguageAccess(userId, languageId);

  await prisma.user.update({
    where: { id: userId },
    data: { activeLanguageId: languageId },
  });

  return languageId;
};

export const resolveActiveLanguageForUser = async (
  userOrId: string | UserRecordInput,
  requestedLanguageId?: string | null,
): Promise<ResolveActiveLanguageResult> => {
  const user = toUserRecord(userOrId);

  await syncGlobalLanguagesForUser(user);

  const links = await prisma.userLanguage.findMany({
    where: { userId: user.id },
    include: { language: true },
    orderBy: [{ language: { createdAt: 'asc' } }, { createdAt: 'asc' }],
  });

  const languages = links.map((link) => link.language);
  if (languages.length === 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeLanguageId: null },
    });

    return {
      languages,
      activeLanguageId: null,
    };
  }

  const languageIds = new Set(languages.map((language) => language.id));
  const requested = (requestedLanguageId ?? '').trim();

  let activeLanguageId =
    requested.length > 0 && languageIds.has(requested) ? requested : null;

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeLanguageId: true },
  });

  if (!activeLanguageId && userRecord?.activeLanguageId) {
    if (languageIds.has(userRecord.activeLanguageId)) {
      activeLanguageId = userRecord.activeLanguageId;
    }
  }

  if (!activeLanguageId) {
    activeLanguageId = languages[0].id;
  }

  if (userRecord?.activeLanguageId !== activeLanguageId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeLanguageId },
    });
  }

  return {
    languages,
    activeLanguageId,
  };
};

export const assertUserLanguageAccess = async (
  userId: string,
  languageId: string,
) => {
  const existingLink = await prisma.userLanguage.findUnique({
    where: {
      userId_languageId: {
        userId,
        languageId,
      },
    },
  });

  if (existingLink) {
    return existingLink;
  }

  const language = await prisma.language.findUnique({
    where: { id: languageId },
    select: { id: true },
  });

  if (!language) {
    throw new ForbiddenError('Acces refuse pour cette langue.');
  }

  await ensureUserRecord({ id: userId });

  return prisma.userLanguage.upsert({
    where: {
      userId_languageId: {
        userId,
        languageId,
      },
    },
    update: {},
    create: {
      userId,
      languageId,
    },
  });
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

    await tx.user.update({
      where: { id: user.id },
      data: {
        activeLanguageId: language.id,
      },
    });

    return language;
  });
};
