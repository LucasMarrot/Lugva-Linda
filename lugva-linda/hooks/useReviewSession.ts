import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Rating } from 'ts-fsrs';
import { processReview } from '@/actions/review-actions';
import { ReviewCard } from '@/lib/validation/schemas';

export type SessionStats = {
  easy: number;
  good: number;
  hard: number;
  again: number;
};

export type CardState = {
  isFlipped: boolean;
  hasBeenRevealed: boolean;
  isSubmitting: boolean;
};

type ValidGrade = Exclude<Rating, Rating.Manual>;

export const useReviewSession = (
  initialCards: ReviewCard[],
  onComplete: (stats: SessionStats) => void,
  isSimulationMode: boolean = false,
) => {
  const router = useRouter();

  const [queue] = useState<ReviewCard[]>(initialCards || []);
  const [lapses, setLapses] = useState<ReviewCard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'normal' | 'lapses'>('normal');
  const [showLapseTransition, setShowLapseTransition] = useState(false);

  const [cardState, setCardState] = useState<CardState>({
    isFlipped: false,
    hasBeenRevealed: false,
    isSubmitting: false,
  });

  const [stats, setStats] = useState<SessionStats>({
    easy: 0,
    good: 0,
    hard: 0,
    again: 0,
  });
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const currentCard =
    phase === 'normal' ? queue[currentIndex] : lapses[currentIndex];

  const handleFlip = useCallback(() => {
    setCardState((prev) => {
      if (!prev.hasBeenRevealed) {
        setTimeout(() => {
          setCardState((current) => ({ ...current, hasBeenRevealed: true }));
        }, 150);
      }

      return { ...prev, isFlipped: !prev.isFlipped };
    });
  }, []);

  const dismissTransition = useCallback(() => {
    setShowLapseTransition(false);
    setStartTime(Date.now());
  }, []);

  const handleRate = useCallback(
    async (grade: ValidGrade) => {
      if (!currentCard || cardState.isSubmitting) return;

      setCardState((prev) => ({ ...prev, isSubmitting: true }));
      const durationMs = Date.now() - startTime;

      try {
        if (!isSimulationMode) {
          await processReview(currentCard.id, grade, durationMs);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const nextStats = { ...stats };
        if (grade === Rating.Again) nextStats.again += 1;
        if (grade === Rating.Hard) nextStats.hard += 1;
        if (grade === Rating.Good) nextStats.good += 1;
        if (grade === Rating.Easy) nextStats.easy += 1;

        setStats(nextStats);

        const nextLapsesCount =
          lapses.length + (grade === Rating.Again ? 1 : 0);
        let nextLapses = lapses;

        if (grade === Rating.Again && phase === 'normal') {
          nextLapses = [...lapses, currentCard];
          setLapses(nextLapses);
        }

        if (phase === 'normal') {
          if (currentIndex + 1 < queue.length) {
            setCurrentIndex((prev) => prev + 1);
            setCardState({
              isFlipped: false,
              hasBeenRevealed: false,
              isSubmitting: false,
            });
            setStartTime(Date.now());
          } else if (nextLapsesCount > 0) {
            setPhase('lapses');
            setCurrentIndex(0);
            setShowLapseTransition(true);
            setCardState({
              isFlipped: false,
              hasBeenRevealed: false,
              isSubmitting: false,
            });
          } else {
            if (!isSimulationMode) router.refresh();
            onComplete(nextStats);
          }
        } else {
          if (currentIndex + 1 < nextLapsesCount) {
            setCurrentIndex((prev) => prev + 1);
            setCardState({
              isFlipped: false,
              hasBeenRevealed: false,
              isSubmitting: false,
            });
            setStartTime(Date.now());
          } else {
            if (!isSimulationMode) router.refresh();
            onComplete(nextStats);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la notation :', error);
        setCardState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [
      cardState.isSubmitting,
      currentCard,
      isSimulationMode,
      phase,
      currentIndex,
      queue.length,
      lapses,
      stats,
      startTime,
      router,
      onComplete,
    ],
  );

  const handleNext = useCallback(() => {
    if (phase === 'normal') {
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        setCardState({
          isFlipped: false,
          hasBeenRevealed: false,
          isSubmitting: false,
        });
        setStartTime(Date.now());
      } else if (lapses.length > 0) {
        setPhase('lapses');
        setCurrentIndex(0);
        setShowLapseTransition(true);
        setCardState({
          isFlipped: false,
          hasBeenRevealed: false,
          isSubmitting: false,
        });
      } else {
        if (!isSimulationMode) router.refresh();
        onComplete(stats);
      }
    } else {
      if (currentIndex + 1 < lapses.length) {
        setCurrentIndex((prev) => prev + 1);
        setCardState({
          isFlipped: false,
          hasBeenRevealed: false,
          isSubmitting: false,
        });
        setStartTime(Date.now());
      } else {
        if (!isSimulationMode) router.refresh();
        onComplete(stats);
      }
    }
  }, [
    phase,
    currentIndex,
    queue.length,
    lapses.length,
    isSimulationMode,
    router,
    onComplete,
    stats,
  ]);

  return {
    currentCard,
    progress: {
      initialCount: queue.length,
      currentIndex:
        phase === 'normal' ? currentIndex : queue.length + currentIndex,
      lapsesCount: lapses.length,
    },
    cardState,
    showLapseTransition,
    actions: {
      handleFlip,
      handleRate,
      dismissTransition,
      handleNext,
    },
  };
};
