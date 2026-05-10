'use server';

import { ReviewGrade } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import prisma from '@/lib/prisma';
import {
  GetDueWordsOptions,
  getDueWordsSchema,
  processReviewSchema,
  ValidGrade,
} from '@/lib/validation/schemas';
import {
  requireAuthenticatedUser,
  verifyLanguageOwnership,
} from '@/lib/auth/server';
import {
  getDueWordsForReview,
  processReviewForWord,
} from '@/lib/services/review-service';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';
import {
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  startOfDay,
  subDays,
} from 'date-fns';
import { revalidatePath } from 'next/cache';

export const processReview = async (
  wordId: string,
  grade: ValidGrade,
  durationMs?: number,
) => {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    await assertCsrfForAction({
      subject: user.id,
    });
    assertRateLimit(`process-review:${user.id}`, 120, 60_000);

    const parsed = processReviewSchema.parse({
      wordId,
      grade,
      durationMs,
    });

    const result = await processReviewForWord(
      user.id,
      parsed.wordId,
      mapValidGradeToReviewGrade(parsed.grade as ValidGrade),
      parsed.durationMs,
    );

    revalidatePath('/');

    logActionSuccess('processReview', userId, startedAt);
    return result;
  } catch (error) {
    logActionError('processReview', userId, error, startedAt);
    throw toActionError(error);
  }
};

export const getDueWords = async (options: GetDueWordsOptions) => {
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const parsed = getDueWordsSchema.parse({
      languageId: options.languageId,
      limit: options.limit,
      mode: options.mode,
    });

    await verifyLanguageOwnership(parsed.languageId, user.id);

    return getDueWordsForReview(user.id, parsed.languageId, {
      limit: parsed.limit,
      mode: parsed.mode,
    });
  } catch (error) {
    logActionError('getDueWords', userId, error);
    throw toActionError(error);
  }
};

const mapValidGradeToReviewGrade = (grade: ValidGrade): ReviewGrade => {
  if (grade === Rating.Again) return ReviewGrade.AGAIN;
  if (grade === Rating.Hard) return ReviewGrade.HARD;
  if (grade === Rating.Good) return ReviewGrade.GOOD;
  return ReviewGrade.EASY;
};

type DailyStats = {
  READING: number;
  WRITING: number;
  PRONUNCIATION: number;
  total: number;
};

export type ReviewCalendarData = {
  planned: Record<string, DailyStats>;
  completed: Record<string, DailyStats>;
  missedDates: string[];
};

export const getReviewCalendarData = async (
  languageId: string,
  daysLimit = 35,
): Promise<ReviewCalendarData> => {
  const user = await requireAuthenticatedUser();
  await verifyLanguageOwnership(languageId, user.id);

  const today = startOfDay(new Date());
  const limitDate = addDays(today, daysLimit);
  const todayStr = format(today, 'yyyy-MM-dd');

  // 1. Récupération des cartes
  const cards = await prisma.card.findMany({
    where: { ownerId: user.id, languageId, word: { isDeleted: false } },
    select: { due: true, state: true, type: true },
  });

  // 🚀 CORRECTION DE 'ANY' : On utilise notre type DailyStats
  const planned: Record<string, DailyStats> = {};
  let earliestOverdue: Date | null = null;

  cards.forEach((card) => {
    const cardDueDay = startOfDay(card.due);

    // 🚀 CORRECTION DE 'limitDate' : On ignore les mots prévus trop loin dans le futur
    if (cardDueDay.getTime() > limitDate.getTime()) {
      return;
    }

    const dateStr = format(cardDueDay, 'yyyy-MM-dd');
    const isOverdue = isBefore(cardDueDay, today);
    const targetDateStr = isOverdue ? todayStr : dateStr;

    // Initialisation stricte de l'objet stats
    if (!planned[targetDateStr]) {
      planned[targetDateStr] = {
        READING: 0,
        WRITING: 0,
        PRONUNCIATION: 0,
        total: 0,
      };
    }

    // Incrémentation (Adapté à ExerciseType de ton schema.prisma)
    if (card.type === 'RECOGNITION') planned[targetDateStr].READING++;
    else if (card.type === 'SPEAKING') planned[targetDateStr].PRONUNCIATION++;
    else planned[targetDateStr].WRITING++; // REVERSE ou SPELLING

    planned[targetDateStr].total++;

    if (
      isOverdue &&
      (!earliestOverdue || isBefore(cardDueDay, earliestOverdue))
    ) {
      earliestOverdue = cardDueDay;
    }
  });

  // 2. Récupération des logs (Sessions passées complétées)
  const logs = await prisma.reviewLog.findMany({
    where: { ownerId: user.id, languageId },
    include: { card: true },
  });

  // 🚀 CORRECTION DE 'ANY' : On utilise notre type DailyStats
  const completed: Record<string, DailyStats> = {};

  logs.forEach((log) => {
    const logDateStr = format(log.reviewDate, 'yyyy-MM-dd');

    if (!completed[logDateStr]) {
      completed[logDateStr] = {
        READING: 0,
        WRITING: 0,
        PRONUNCIATION: 0,
        total: 0,
      };
    }

    if (log.card.type === 'RECOGNITION') completed[logDateStr].READING++;
    else if (log.card.type === 'SPEAKING')
      completed[logDateStr].PRONUNCIATION++;
    else completed[logDateStr].WRITING++;

    completed[logDateStr].total++;
  });

  // 3. Calcul des manqués
  const missedDatesSet = new Set<string>();

  if (earliestOverdue) {
    const oldestAllowedMissedDate = subDays(today, 60);
    const yesterday = subDays(today, 1);

    const startMissed = isBefore(earliestOverdue, oldestAllowedMissedDate)
      ? oldestAllowedMissedDate
      : earliestOverdue;

    if (startMissed.getTime() <= yesterday.getTime()) {
      const interval = eachDayOfInterval({
        start: startMissed,
        end: yesterday,
      });
      interval.forEach((day) => {
        missedDatesSet.add(format(day, 'yyyy-MM-dd'));
      });
    }
  }

  const missedDates = Array.from(missedDatesSet);

  return { planned, completed, missedDates };
};
