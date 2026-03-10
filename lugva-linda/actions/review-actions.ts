'use server';

import { fsrsEngine, mapWordToCard, mapCardToWordUpdate } from '@/lib/fsrs';
import prisma from '@/lib/prisma';
import { Rating } from 'ts-fsrs';

type ValidGrade = Exclude<Rating, Rating.Manual>;

export const getDueWords = async (languageId: string, limit: number = 10) => {
  const now = new Date();

  const dueWords = await prisma.word.findMany({
    where: {
      languageId,
      due: { lte: now },
      state: { not: 0 },
    },
    take: limit,
    orderBy: { due: 'asc' },
  });

  if (dueWords.length < limit) {
    const newWords = await prisma.word.findMany({
      where: {
        languageId,
        state: 0,
      },
      take: limit - dueWords.length,
      orderBy: { createdAt: 'asc' },
    });

    return [...dueWords, ...newWords];
  }

  return dueWords;
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
