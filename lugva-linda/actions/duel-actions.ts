'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth/server';

export type DuelWord = {
  id: string;
  term: string;
  translation: string;
  mandatoryTag: string;
  ownerId: string;
};

export const generateDuelDeck = async (
  challengerId: string,
  targetId: string,
  languageId: string,
): Promise<DuelWord[]> => {
  await requireAuthenticatedUser();

  const challengerWords = await prisma.word.findMany({
    where: {
      ownerId: challengerId,
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    select: {
      id: true,
      term: true,
      translation: true,
      ownerId: true,
      mandatoryTag: true,
    },
    take: 50,
  });

  const targetWords = await prisma.word.findMany({
    where: {
      ownerId: targetId,
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    select: {
      id: true,
      term: true,
      translation: true,
      ownerId: true,
      mandatoryTag: true,
    },
    take: 50,
  });

  const shuffle = <T>(array: T[]): T[] => {
    return [...array].sort(() => 0.5 - Math.random());
  };

  const selectedChallengerWords = shuffle(challengerWords).slice(0, 5);
  const selectedTargetWords = shuffle(targetWords).slice(0, 5);

  const finalDeck = shuffle([
    ...selectedChallengerWords,
    ...selectedTargetWords,
  ]);

  return finalDeck;
};
