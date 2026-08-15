import { ReviewGrade, type Card } from '@prisma/client';
import { Rating } from 'ts-fsrs';

import prisma from '@/lib/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { fsrsEngine, mapDbCardToFsrsCard, validateFsrsCard } from '@/lib/fsrs';
import { assertUserLanguageAccess } from '@/lib/services/language-service';
import { ensureDailySnapshots } from '@/lib/services/daily-snapshot';
import { endOfDay, format } from 'date-fns';
import { ReviewMode } from '../validation/schemas';

const mapRatingToReviewGrade = (rating: Rating) => {
  if (rating === Rating.Again) return ReviewGrade.AGAIN;
  if (rating === Rating.Hard) return ReviewGrade.HARD;
  if (rating === Rating.Good) return ReviewGrade.GOOD;
  if (rating === Rating.Easy) return ReviewGrade.EASY;
  throw new ValidationError(
    'Note de revision invalide.',
    'INVALID_REVIEW_GRADE',
  );
};

const mapReviewGradeToRating = (grade: ReviewGrade) => {
  if (grade === ReviewGrade.AGAIN) return Rating.Again;
  if (grade === ReviewGrade.HARD) return Rating.Hard;
  if (grade === ReviewGrade.GOOD) return Rating.Good;
  return Rating.Easy;
};

const selectReviewCards = async (
  userId: string,
  languageId: string,
  limit: number,
  mode: ReviewMode,
) => {
  if (mode === 'PRACTICE') {
    const allCards = await prisma.card.findMany({
      where: {
        ownerId: userId,
        languageId,
        state: { not: 0 },
        word: { isDeleted: false, deleteToken: BigInt(0) },
      },
      include: { word: true },
    });

    const shuffledCards = allCards.sort(() => 0.5 - Math.random());

    return shuffledCards.slice(0, limit);
  }

  const limitDate = endOfDay(new Date());

  const dueCards = await prisma.card.findMany({
    where: {
      ownerId: userId,
      languageId,
      due: { lte: limitDate },
      state: { not: 0 },
      word: {
        isDeleted: false,
        deleteToken: BigInt(0),
      },
    },
    include: { word: true },
    take: limit,
    orderBy: { due: 'asc' },
  });

  const newCards =
    dueCards.length < limit
      ? await prisma.card.findMany({
          where: {
            ownerId: userId,
            languageId,
            state: 0,
            word: {
              isDeleted: false,
              deleteToken: BigInt(0),
            },
          },
          include: { word: true },
          take: limit - dueCards.length,
          orderBy: { createdAt: 'asc' },
        })
      : [];

  let cards = [...dueCards, ...newCards];

  if (mode === 'ALLOW_EARLY' && cards.length === 0) {
    const nextCard = await prisma.card.findFirst({
      where: {
        ownerId: userId,
        languageId,
        due: { gt: limitDate },
        state: { not: 0 },
        word: { isDeleted: false, deleteToken: BigInt(0) },
      },
      orderBy: { due: 'asc' },
    });

    if (nextCard) {
      const endOfNextSessionDay = endOfDay(nextCard.due);

      const earlyCards = await prisma.card.findMany({
        where: {
          ownerId: userId,
          languageId,
          due: { gt: limitDate, lte: endOfNextSessionDay },
          state: { not: 0 },
          word: { isDeleted: false, deleteToken: BigInt(0) },
        },
        include: { word: true },
        take: limit,
        orderBy: { due: 'asc' },
      });

      cards = [...earlyCards];
    }
  }

  return cards;
};

export const getDueCardsForReview = async (
  userId: string,
  languageId: string,
  options: { limit: number; mode: ReviewMode },
) => {
  await assertUserLanguageAccess(userId, languageId);

  const cards = await selectReviewCards(
    userId,
    languageId,
    options.limit,
    options.mode,
  );

  return cards;
};

const getCardForReviewById = async (userId: string, cardId: string) => {
  const card = await prisma.card.findFirst({
    where: {
      ownerId: userId,
      id: cardId,
    },
    include: { word: true },
  });

  if (!card) {
    throw new NotFoundError('Carte de révision introuvable.');
  }

  if (card.word.isDeleted || card.word.deleteToken !== BigInt(0)) {
    throw new ForbiddenError('Cette carte appartient à un mot supprimé.');
  }

  return card;
};

const buildNextCardUpdate = (
  nextCard: ReturnType<typeof mapDbCardToFsrsCard>,
) => ({
  due: nextCard.due,
  stability: nextCard.stability,
  difficulty: nextCard.difficulty,
  scheduledDays: nextCard.scheduled_days,
  reps: nextCard.reps,
  lapses: nextCard.lapses,
  state: Number(nextCard.state),
  lastReview: nextCard.last_review ?? null,
});

export const processReviewForCard = async (
  userId: string,
  cardId: string,
  grade: ReviewGrade,
  durationMs?: number,
) => {
  const card = await getCardForReviewById(userId, cardId);

  await assertUserLanguageAccess(userId, card.languageId);

  await ensureDailySnapshots(userId, card.languageId);

  const fsrsCard = mapDbCardToFsrsCard(card as Card);
  const schedulingCards = fsrsEngine.repeat(fsrsCard, new Date());

  const selectedRating = mapReviewGradeToRating(grade);
  const recordLog = schedulingCards[selectedRating];
  const nextFsrsCard = validateFsrsCard(recordLog.card);
  const reviewLog = recordLog.log;
  const reviewDate = new Date();

  const todayStr = format(reviewDate, 'yyyy-MM-dd');

  let readInc = 0,
    writeInc = 0,
    pronInc = 0;
  if (card.type === 'RECOGNITION' || card.type === 'REVERSE') readInc = 1;
  else if (card.type === 'SPEAKING') pronInc = 1;
  else writeInc = 1;

  const duration = durationMs ?? 0;
  const isAgain = grade === ReviewGrade.AGAIN ? 1 : 0;
  const isHard = grade === ReviewGrade.HARD ? 1 : 0;
  const isGood = grade === ReviewGrade.GOOD ? 1 : 0;
  const isEasy = grade === ReviewGrade.EASY ? 1 : 0;

  await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: buildNextCardUpdate(nextFsrsCard),
    }),
    prisma.reviewLog.create({
      data: {
        cardId: card.id,
        ownerId: userId,
        languageId: card.languageId,
        grade: mapRatingToReviewGrade(selectedRating),
        reviewDate,
        durationMs: durationMs ?? null,
        state: Number(reviewLog.state),
        due: reviewLog.due,
        stability: reviewLog.stability,
        difficulty: reviewLog.difficulty,
        elapsedDays: reviewLog.elapsed_days,
        lastElapsedDays: reviewLog.last_elapsed_days,
        scheduledDays: reviewLog.scheduled_days,
      },
    }),

    // Mise à jour de la journée d'aujourd'hui (Statistiques + hadDueCards)
    prisma.dailyStat.upsert({
      where: {
        ownerId_languageId_date: {
          ownerId: userId,
          languageId: card.languageId,
          date: todayStr,
        },
      },
      create: {
        ownerId: userId,
        languageId: card.languageId,
        date: todayStr,
        hadDueCards: true,
        completedCards: 1,
        readingCompleted: readInc,
        writingCompleted: writeInc,
        pronunciationCompleted: pronInc,
        totalDurationMs: duration,
        againCount: isAgain,
        hardCount: isHard,
        goodCount: isGood,
        easyCount: isEasy,
      },
      update: {
        hadDueCards: true,
        completedCards: { increment: 1 },
        readingCompleted: { increment: readInc },
        writingCompleted: { increment: writeInc },
        pronunciationCompleted: { increment: pronInc },
        totalDurationMs: { increment: duration },
        againCount: { increment: isAgain },
        hardCount: { increment: isHard },
        goodCount: { increment: isGood },
        easyCount: { increment: isEasy },
      },
    }),
  ]);

  return {
    success: true,
    nextState: nextFsrsCard.state,
    nextDue: nextFsrsCard.due,
  };
};
