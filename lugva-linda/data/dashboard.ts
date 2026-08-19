import prisma from '@/lib/prisma';
import { endOfDay } from 'date-fns';

export async function getDashboardData(
  user: {
    id: string;
    email?: string | null;
  },
  languageId: string,
) {
  const [totalWords, cardsToReview] = await Promise.all([
    prisma.word.count({
      where: {
        ownerId: user.id,
        languageId,
        isDeleted: false,
        deleteToken: BigInt(0),
      },
    }),
    prisma.card.count({
      where: {
        ownerId: user.id,
        languageId,
        due: { lte: endOfDay(new Date()) },
        isWordDeleted: false,
      },
    }),
  ]);

  return {
    totalWords,
    cardsToReview,
  };
}
