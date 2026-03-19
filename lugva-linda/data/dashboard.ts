import prisma from '@/lib/prisma';

export async function getDashboardData(userId: string) {
  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId },
    include: { language: true },
    orderBy: { createdAt: 'asc' },
  });

  const languages = userLanguages.map((userLanguage) => userLanguage.language);

  const totalWords = await prisma.word.count({
    where: {
      ownerId: userId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
  });

  const wordsToReview = await prisma.card.count({
    where: {
      ownerId: userId,
      due: { lte: new Date() },
      state: { not: 0 },
      word: {
        isDeleted: false,
        deleteToken: BigInt(0),
      },
    },
  });

  return {
    languages,
    totalWords,
    wordsToReview,
  };
}
