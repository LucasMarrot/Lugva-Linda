'use server';

import { z } from 'zod';
import { fsrsEngine, mapWordToCard, mapCardToWordUpdate } from '@/lib/fsrs';
import prisma from '@/lib/prisma';
import { Rating } from 'ts-fsrs';
import {
  getDueWordsSchema,
  processReviewSchema,
  reviewSelectionModeSchema,
} from '@/lib/validation/schemas';
import {
  requireAuthenticatedUser,
  verifyLanguageOwnership,
  verifyWordOwnership,
} from '@/lib/auth/server';

type ValidGrade = Exclude<Rating, Rating.Manual>;
type ReviewSelectionMode = z.infer<typeof reviewSelectionModeSchema>;

type GetDueWordsOptions = {
  limit?: number;
  mode?: ReviewSelectionMode;
};

export const getDueWords = async (
  languageId: string,
  options: GetDueWordsOptions = {},
) => {
  const user = await requireAuthenticatedUser();

  const parsed = getDueWordsSchema.parse({
    languageId,
    limit: options.limit,
    mode: options.mode,
  });

  await verifyLanguageOwnership(parsed.languageId, user.id);

  const now = new Date();
  const limit = parsed.limit;

  // Étape A : Les mots urgents (Échus)
  // On prend ceux dont la date est passée, triés du plus en retard au moins en retard
  const dueWords = await prisma.word.findMany({
    where: {
      userId: user.id,
      languageId: parsed.languageId,
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
        userId: user.id,
        languageId: parsed.languageId,
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
  if (parsed.mode === 'ALLOW_EARLY' && results.length < limit) {
    const advanceWords = await prisma.word.findMany({
      where: {
        userId: user.id,
        languageId: parsed.languageId,
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
  const user = await requireAuthenticatedUser();

  const parsed = processReviewSchema.parse({
    wordId,
    grade,
    durationMs,
  });

  const now = new Date();

  const word = await verifyWordOwnership(parsed.wordId, user.id);
  await verifyLanguageOwnership(word.languageId, user.id);

  const card = mapWordToCard(word);

  const schedulingCards = fsrsEngine.repeat(card, now);

  const recordLog = schedulingCards[parsed.grade];
  const nextCard = recordLog.card;
  const reviewLog = recordLog.log;

  const wordUpdateData = mapCardToWordUpdate(nextCard);

  await prisma.$transaction([
    prisma.word.update({
      where: { id: parsed.wordId },
      data: wordUpdateData,
    }),

    prisma.reviewLog.create({
      data: {
        wordId: parsed.wordId,
        grade: parsed.grade,
        reviewDate: now,
        durationMs: parsed.durationMs ?? null,
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
