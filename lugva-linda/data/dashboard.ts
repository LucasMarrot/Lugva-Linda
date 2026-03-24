import prisma from '@/lib/prisma';
import {
  listGlobalLanguages,
  listUserLanguages,
  syncGlobalLanguagesForUser,
} from '@/lib/services/language-service';

export async function getDashboardData(user: {
  id: string;
  email?: string | null;
}) {
  let languages = await listUserLanguages(user);
  if (languages.length === 0) {
    const globalLanguages = await listGlobalLanguages();
    if (globalLanguages.length > 0) {
      await syncGlobalLanguagesForUser(user);
      languages = await listUserLanguages(user);
    }
  }

  const totalWords = await prisma.word.count({
    where: {
      ownerId: user.id,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
  });

  const wordsToReview = await prisma.card.count({
    where: {
      ownerId: user.id,
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
