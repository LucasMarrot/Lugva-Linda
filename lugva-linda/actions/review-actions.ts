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
  getDueCardsForReview,
  processReviewForCard,
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
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { revalidatePath } from 'next/cache';
import { ensureDailySnapshots } from '@/lib/services/daily-snapshot';
import { FEATURE_EPOCH } from '@/lib/constants';

// --- UTILITAIRES ---

const mapValidGradeToReviewGrade = (grade: ValidGrade): ReviewGrade => {
  if (grade === Rating.Again) return ReviewGrade.AGAIN;
  if (grade === Rating.Hard) return ReviewGrade.HARD;
  if (grade === Rating.Good) return ReviewGrade.GOOD;
  return ReviewGrade.EASY;
};

// --- ACTIONS DE RÉVISION ---

export const processReview = async (
  cardId: string,
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
      cardId,
      grade,
      durationMs,
    });

    const result = await processReviewForCard(
      user.id,
      parsed.cardId,
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

export const getDueCards = async (options: GetDueWordsOptions) => {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    const parsed = getDueWordsSchema.parse({
      languageId: options.languageId,
      limit: options.limit,
      mode: options.mode,
    });

    await verifyLanguageOwnership(parsed.languageId, user.id);

    const cards = await getDueCardsForReview(user.id, parsed.languageId, {
      limit: parsed.limit,
      mode: parsed.mode,
    });

    logActionSuccess('getDueCards', userId, startedAt);

    return cards;
  } catch (error) {
    logActionError('getDueCards', userId, error, startedAt);
    throw toActionError(error);
  }
};

// --- CALENDRIER DE RÉVISION ---

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
  displayYear: number,
  displayMonth: number,
  selectedDateStr?: string,
): Promise<ReviewCalendarData> => {
  const user = await requireAuthenticatedUser();
  await verifyLanguageOwnership(languageId, user.id);

  // ── Variables temporelles & délimitation du mois affiché ──────────
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  const targetDate = new Date(displayYear, displayMonth - 1, 1);
  const displayStart = subDays(startOfMonth(targetDate), 10);
  const displayEnd = addDays(endOfMonth(targetDate), 10);

  const displayStartStr = format(displayStart, 'yyyy-MM-dd');
  const displayEndStr = format(displayEnd, 'yyyy-MM-dd');

  // ── Epoch dynamique + Lazy Snapshot (une seule requête userLanguage) ──
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_languageId: { userId: user.id, languageId } },
    select: { createdAt: true },
  });

  let epochStr = userLanguage
    ? format(userLanguage.createdAt, 'yyyy-MM-dd')
    : todayStr;
  if (epochStr < FEATURE_EPOCH) epochStr = FEATURE_EPOCH;

  await ensureDailySnapshots(user.id, languageId);

  // ── Requête 1 : DailyStat pour le mois affiché ────────────────
  // Source de vérité pour les jours passés (Vert + Rouge)
  const stats = await prisma.dailyStat.findMany({
    where: {
      ownerId: user.id,
      languageId,
      date: { gte: displayStartStr, lte: displayEndStr },
    },
  });

  // ── Requête 2 : Cartes dues pour le futur (Bleu) ──────────────
  // On récupère toutes les cartes dues entre aujourd'hui et la fin de
  // la grille affichée pour calculer les pastilles "Prévu"
  const futureEnd = displayEnd > addDays(today, 60) ? displayEnd : addDays(today, 60);

  const dueCards = await prisma.card.findMany({
    where: {
      ownerId: user.id,
      languageId,
      due: { lte: futureEnd },
      word: { isDeleted: false },
    },
    select: { due: true, type: true },
  });

  // ── Construction des résultats ─────────────────────────────────
  const planned: Record<string, DailyStats> = {};
  const completed: Record<string, DailyStats> = {};
  const missedDates: string[] = [];

  // A. Jours passés via DailyStat
  for (const stat of stats) {
    // Vert : l'utilisateur a révisé ce jour-là
    if (stat.completedCards > 0) {
      completed[stat.date] = {
        READING: stat.readingCompleted,
        WRITING: stat.writingCompleted,
        PRONUNCIATION: stat.pronunciationCompleted,
        total: stat.completedCards,
      };
    }

    // Rouge : jour passé, avec obligation, sans révision, après l'epoch
    if (
      stat.hadDueCards &&
      stat.completedCards === 0 &&
      stat.date < todayStr &&
      stat.date >= epochStr
    ) {
      missedDates.push(stat.date);
    }
  }

  // B. Jours futurs/aujourd'hui : cartes dues
  for (const card of dueCards) {
    const cardDueDay = startOfDay(card.due);
    // Cartes en retard → regroupées sur aujourd'hui
    const isOverdue = cardDueDay < today;
    const targetDateStr = isOverdue
      ? todayStr
      : format(cardDueDay, 'yyyy-MM-dd');

    // Ne montrer les "planned" que pour aujourd'hui ou le futur
    if (targetDateStr < todayStr) continue;

    // Vérifie que la date est dans la grille affichée
    if (targetDateStr < displayStartStr || targetDateStr > displayEndStr) {
      // Exception : permettre la date sélectionnée
      if (!selectedDateStr || targetDateStr !== selectedDateStr) continue;
    }

    if (!planned[targetDateStr]) {
      planned[targetDateStr] = {
        READING: 0,
        WRITING: 0,
        PRONUNCIATION: 0,
        total: 0,
      };
    }

    if (card.type === 'RECOGNITION' || card.type === 'REVERSE')
      planned[targetDateStr].READING++;
    else if (card.type === 'SPEAKING') planned[targetDateStr].PRONUNCIATION++;
    else planned[targetDateStr].WRITING++;

    planned[targetDateStr].total++;
  }

  return { planned, completed, missedDates };
};

