import prisma from '@/lib/prisma';
import {
  listGlobalLanguages,
  listUserLanguages,
  syncGlobalLanguagesForUser,
} from '@/lib/services/language-service';
import { endOfDay } from 'date-fns';

export async function getDashboardData(
  user: {
    id: string;
    email?: string | null;
  },
  languageId: string,
) {
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
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
  });

  const cardsToReview = await prisma.card.count({
    where: {
      ownerId: user.id,
      languageId,
      due: { lte: endOfDay(new Date()) },
      word: {
        isDeleted: false,
        deleteToken: BigInt(0),
      },
    },
  });

  return {
    languages,
    totalWords,
    cardsToReview,
  };
}
