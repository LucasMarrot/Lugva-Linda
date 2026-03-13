'use server';

import { fsrsEngine, mapWordToCard, mapCardToWordUpdate } from '@/lib/fsrs';
import prisma from '@/lib/prisma';
import { Rating } from 'ts-fsrs';

type ValidGrade = Exclude<Rating, Rating.Manual>;

export const getDueWords = async (languageId: string, limit: number = 10) => {
  const now = new Date();

  // Étape A : Les mots urgents (Échus)
  // On prend ceux dont la date est passée, triés du plus en retard au moins en retard
  const dueWords = await prisma.word.findMany({
    where: {
      languageId,
      due: { lte: now },
      state: { not: 0 },
    },
    take: limit,
    orderBy: { due: 'asc' },
  });

  // Étape B : Les nouveaux mots
  // Si on n'a pas atteint la limite, on intègre des mots jamais appris
  let newWords: typeof dueWords = [];
  if (dueWords.length < limit) {
    newWords = await prisma.word.findMany({
      where: {
        languageId,
        state: 0,
      },
      take: limit - dueWords.length,
      orderBy: { createdAt: 'asc' },
    });
  }

  let results = [...dueWords, ...newWords];

  // Étape C (DÉFINITIVE) : La Révision Anticipée (Advance Review)
  // Si la session n'est toujours pas pleine,
  // on prend les mots déjà appris les plus proches d'être oubliés dans le futur.
  if (results.length < limit) {
    const advanceWords = await prisma.word.findMany({
      where: {
        languageId,
        due: { gt: now },
        state: { not: 0 },
      },
      take: limit - results.length,
      orderBy: { due: 'asc' },
    });

    results = [...results, ...advanceWords];
  }

  return results;
};

export const processReview = async (
  wordId: string,
  grade: ValidGrade,
  durationMs?: number,
) => {
  const now = new Date();

  const word = await prisma.word.findUnique({
    where: { id: wordId },
  });

  if (!word) {
    throw new Error('Mot introuvable.');
  }

  const card = mapWordToCard(word);

  const schedulingCards = fsrsEngine.repeat(card, now);

  const recordLog = schedulingCards[grade];
  const nextCard = recordLog.card;
  const reviewLog = recordLog.log;

  const wordUpdateData = mapCardToWordUpdate(nextCard);

  await prisma.$transaction([
    prisma.word.update({
      where: { id: wordId },
      data: wordUpdateData,
    }),

    prisma.reviewLog.create({
      data: {
        wordId,
        grade,
        reviewDate: now,
        durationMs: durationMs ?? null,
        state: reviewLog.state as number,
        due: reviewLog.due,
        stability: reviewLog.stability,
        difficulty: reviewLog.difficulty,
        elapsedDays: reviewLog.elapsed_days,
        lastElapsedDays: reviewLog.last_elapsed_days,
        scheduledDays: reviewLog.scheduled_days,
      },
    }),
  ]);

  return {
    success: true,
    nextState: nextCard.state,
    nextDue: nextCard.due,
  };
};
