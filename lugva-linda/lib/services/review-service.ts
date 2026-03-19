import { ExerciseType, ReviewGrade, type Card } from '@prisma/client';
import { Rating } from 'ts-fsrs';

import prisma from '@/lib/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { fsrsEngine, mapDbCardToFsrsCard, validateFsrsCard } from '@/lib/fsrs';
import { assertUserLanguageAccess } from '@/lib/services/language-service';

type ReviewSelectionMode = 'DUE_ONLY' | 'ALLOW_EARLY';

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
  mode: ReviewSelectionMode,
) => {
  const now = new Date();

  const dueCards = await prisma.card.findMany({
    where: {
      ownerId: userId,
      languageId,
      due: { lte: now },
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

  if (mode === 'ALLOW_EARLY' && cards.length < limit) {
    const earlyCards = await prisma.card.findMany({
      where: {
        ownerId: userId,
        languageId,
        due: { gt: now },
        state: { not: 0 },
        word: {
          isDeleted: false,
          deleteToken: BigInt(0),
        },
      },
      include: { word: true },
      take: limit - cards.length,
      orderBy: { due: 'asc' },
    });

    cards = [...cards, ...earlyCards];
  }

  return cards;
};

export const getDueWordsForReview = async (
  userId: string,
  languageId: string,
  options: { limit: number; mode: ReviewSelectionMode },
) => {
  await assertUserLanguageAccess(userId, languageId);

  const cards = await selectReviewCards(
    userId,
    languageId,
    options.limit,
    options.mode,
  );

  // Keep the current UI payload shape while review becomes card-centric.
  return cards.map((item) => ({
    ...item.word,
    cardId: item.id,
  }));
};

const getCardForReview = async (userId: string, wordId: string) => {
  const card = await prisma.card.findFirst({
    where: {
      ownerId: userId,
      wordId,
      type: ExerciseType.RECOGNITION,
    },
    include: { word: true },
  });

  if (!card) {
    throw new NotFoundError('Carte de revision introuvable.');
  }

  if (card.word.isDeleted || card.word.deleteToken !== BigInt(0)) {
    throw new ForbiddenError('Cette carte appartient a un mot supprime.');
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

export const processReviewForWord = async (
  userId: string,
  wordId: string,
  grade: ReviewGrade,
  durationMs?: number,
) => {
  const card = await getCardForReview(userId, wordId);

  await assertUserLanguageAccess(userId, card.languageId);

  const fsrsCard = mapDbCardToFsrsCard(card as Card);
  const schedulingCards = fsrsEngine.repeat(fsrsCard, new Date());

  const selectedRating = mapReviewGradeToRating(grade);
  const recordLog = schedulingCards[selectedRating];
  const nextFsrsCard = validateFsrsCard(recordLog.card);
  const reviewLog = recordLog.log;
  const reviewDate = new Date();

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
  ]);

  return {
    success: true,
    nextState: nextFsrsCard.state,
    nextDue: nextFsrsCard.due,
  };
};
