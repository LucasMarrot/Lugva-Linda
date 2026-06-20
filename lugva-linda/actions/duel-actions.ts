'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth/server';

export type DuelWord = {
  id: string;
  term: string;
  translation: string;
  mandatoryTag: string;
  ownerId: string;
  synonyms: string[];
};

export const generateDuelDeck = async (
  challengerId: string,
  targetId: string,
  languageId: string,
): Promise<DuelWord[]> => {
  await requireAuthenticatedUser();

  const selectFields = {
    id: true,
    term: true,
    translation: true,
    translationNormalized: true,
    ownerId: true,
    mandatoryTag: true,
    synonyms: true,
  };

  const challengerWords = await prisma.word.findMany({
    where: {
      ownerId: challengerId,
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    select: selectFields,
    take: 50,
  });

  const targetWords = await prisma.word.findMany({
    where: {
      ownerId: targetId,
      languageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    select: selectFields,
    take: 50,
  });

  const shuffle = <T>(array: T[]): T[] => {
    return [...array].sort(() => 0.5 - Math.random());
  };

  const selectedChallengerWords = shuffle(challengerWords).slice(0, 5);
  const selectedTargetWords = shuffle(targetWords).slice(0, 5);
  const initialSelection = [...selectedChallengerWords, ...selectedTargetWords];

  const selectedTranslations = initialSelection.map(
    (w) => w.translationNormalized,
  );

  const allMatchingWords = await prisma.word.findMany({
    where: {
      ownerId: { in: [challengerId, targetId] },
      languageId,
      translationNormalized: { in: selectedTranslations },
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    select: {
      term: true,
      synonyms: true,
      translationNormalized: true,
    },
  });

  const validTermsByTranslation = new Map<string, Set<string>>();
  for (const word of allMatchingWords) {
    if (!validTermsByTranslation.has(word.translationNormalized)) {
      validTermsByTranslation.set(word.translationNormalized, new Set());
    }
    const set = validTermsByTranslation.get(word.translationNormalized)!;
    set.add(word.term);
    word.synonyms.forEach((s) => set.add(s));
  }

  return initialSelection.map((word) => {
    const allValidTerms = Array.from(
      validTermsByTranslation.get(word.translationNormalized) ||
        new Set<string>(),
    );

    const mergedSynonyms = allValidTerms.filter((t) => t !== word.term);

    return {
      id: word.id,
      term: word.term,
      translation: word.translation,
      mandatoryTag: word.mandatoryTag,
      ownerId: word.ownerId,
      synonyms: mergedSynonyms,
    };
  });
};
