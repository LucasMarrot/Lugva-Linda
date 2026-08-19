import prisma from '@/lib/prisma';
import { FEATURE_EPOCH } from '@/lib/constants';
import {
  format,
  startOfDay,
  subDays,
  eachDayOfInterval,
  endOfDay,
} from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// Daily Snapshot Service
// ─────────────────────────────────────────────────────────────────────────────
// Garantit que chaque jour passé entre l'epoch et hier a un `hadDueCards`
// correct dans DailyStat.
//
// STRATÉGIE : On utilise UNIQUEMENT l'état actuel des cartes (card.due).
// Pas de ReviewLog, pas d'intervalles. C'est fiable car :
//
//   1. Ce service tourne AVANT toute révision du jour (appelé au début de
//      processReviewForCard ET de getReviewCalendarData).
//   2. Tant qu'aucune révision n'a eu lieu aujourd'hui, les dates `due` des
//      cartes reflètent exactement l'état de fin de journée d'hier.
//   3. Pour une absence de N jours : les cartes n'ont pas bougé, donc leur
//      `due` actuel indique précisément depuis quand elles sont en attente.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie si le snapshot a déjà tourné aujourd'hui pour ce user/langue.
 * Optimisation : évite de re-exécuter le snapshot à chaque appel.
 */
const snapshotDoneToday = new Map<string, string>();

export async function ensureDailySnapshots(
  userId: string,
  languageId: string,
): Promise<void> {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const cacheKey = `${userId}:${languageId}`;

  // Si déjà fait aujourd'hui (même processus), on skip
  if (snapshotDoneToday.get(cacheKey) === todayStr) return;

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  // Déterminer l'epoch de l'utilisateur
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_languageId: { userId, languageId } },
    select: { createdAt: true },
  });

  if (!userLanguage) {
    snapshotDoneToday.set(cacheKey, todayStr);
    return;
  }

  let epochStr = format(userLanguage.createdAt, 'yyyy-MM-dd');
  if (epochStr < FEATURE_EPOCH) epochStr = FEATURE_EPOCH;

  // Rien à snapshotter si l'epoch est dans le futur
  if (epochStr > yesterdayStr) {
    snapshotDoneToday.set(cacheKey, todayStr);
    return;
  }

  // Trouver les jours dans [epoch, hier] qui ont DÉJÀ un DailyStat
  const existingStats = await prisma.dailyStat.findMany({
    where: {
      ownerId: userId,
      languageId,
      date: { gte: epochStr, lte: yesterdayStr },
    },
    select: { date: true },
  });

  const coveredDays = new Set(existingStats.map((s) => s.date));

  // Générer tous les jours dans l'intervalle
  const epochDate = startOfDay(new Date(epochStr + 'T00:00:00'));
  const allDays = eachDayOfInterval({ start: epochDate, end: yesterday });

  const uncoveredDays = allDays
    .map((d) => format(d, 'yyyy-MM-dd'))
    .filter((d) => !coveredDays.has(d));

  if (uncoveredDays.length === 0) {
    snapshotDoneToday.set(cacheKey, todayStr);
    return;
  }


  const overdueCards = await prisma.card.findMany({
    where: {
      ownerId: userId,
      languageId,
      due: { lte: endOfDay(yesterday) },
      state: { not: 0 }, // Exclure les cartes neuves (state=0) jamais vues
      isWordDeleted: false,
    },
    select: { due: true },
  });

  // Pour chaque jour non couvert, vérifier si des cartes étaient dues
  const daysToMark = new Set<string>();

  for (const dayStr of uncoveredDays) {
    const dayEnd = endOfDay(new Date(dayStr + 'T00:00:00'));

    const hasDueCard = overdueCards.some((card) => card.due <= dayEnd);

    if (hasDueCard) {
      daysToMark.add(dayStr);
    }
  }

  // ── Batch upsert ──────────────────────────────────────────────────

  if (daysToMark.size > 0) {
    const upserts = Array.from(daysToMark).map((dateStr) =>
      prisma.dailyStat.upsert({
        where: {
          ownerId_languageId_date: {
            ownerId: userId,
            languageId,
            date: dateStr,
          },
        },
        create: {
          ownerId: userId,
          languageId,
          date: dateStr,
          hadDueCards: true,
        },
        update: { hadDueCards: true },
      }),
    );

    const BATCH_SIZE = 50;
    for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
      await prisma.$transaction(upserts.slice(i, i + BATCH_SIZE));
    }
  }

  snapshotDoneToday.set(cacheKey, todayStr);
}
