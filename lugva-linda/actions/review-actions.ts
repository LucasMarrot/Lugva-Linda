'use server';

import { z } from 'zod';
import { ReviewGrade } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import {
  getDueWordsSchema,
  processReviewSchema,
  reviewSelectionModeSchema,
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
  let userId: string | null = null;

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const parsed = getDueWordsSchema.parse({
      languageId,
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

    logActionSuccess('processReview', userId, startedAt);
    return result;
  } catch (error) {
    logActionError('processReview', userId, error, startedAt);
    throw toActionError(error);
  }
};
