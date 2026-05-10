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

export const getReviewCalendarData = async (
  languageId: string,
  daysLimit = 35,
) => {
  const user = await requireAuthenticatedUser();
  await verifyLanguageOwnership(languageId, user.id);

  const today = startOfDay(new Date());
  const limitDate = addDays(today, daysLimit);
  const todayStr = format(today, 'yyyy-MM-dd');

  const logs = await prisma.reviewLog.findMany({
    where: { ownerId: user.id, languageId },
    select: { reviewDate: true },
  });

  const completedDates: string[] = [];
  logs.forEach((log: { reviewDate: Date }) => {
    const logDateStr = format(log.reviewDate, 'yyyy-MM-dd');
    if (!completedDates.includes(logDateStr)) completedDates.push(logDateStr);
  });

  const cards = await prisma.card.findMany({
    where: { ownerId: user.id, languageId, word: { isDeleted: false } },
    select: { due: true, state: true },
  });

  const planned: Record<string, number> = {};
  let earliestOverdue: Date | null = null;

  for (const card of cards) {
    const cardDueDay = startOfDay(card.due);
    const dateStr = format(cardDueDay, 'yyyy-MM-dd');

    if (isBefore(cardDueDay, today)) {
      planned[todayStr] = (planned[todayStr] || 0) + 1;

      if (!earliestOverdue || isBefore(cardDueDay, earliestOverdue)) {
        earliestOverdue = cardDueDay;
      }
    } else if (
      cardDueDay.getTime() >= today.getTime() &&
      cardDueDay.getTime() <= limitDate.getTime()
    ) {
      planned[dateStr] = (planned[dateStr] || 0) + 1;
    }
  }

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

  return { planned, missedDates, completedDates };
};
