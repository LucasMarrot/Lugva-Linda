import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Word } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { processReview } from '@/actions/review-actions';

export type SessionStats = {
  easy: number;
  good: number;
  hard: number;
  again: number;
};

type ValidGrade = Exclude<Rating, Rating.Manual>;

export const useReviewSession = (
  initialWords: Word[],
  onComplete: (stats: SessionStats) => void,
  isSimulationMode: boolean = false,
) => {
  const router = useRouter();

  const [queue] = useState<Word[]>(initialWords);
  const [lapses, setLapses] = useState<Word[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'normal' | 'lapses'>('normal');
  const [showLapseTransition, setShowLapseTransition] = useState(false);

  const [cardState, setCardState] = useState({
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

  const currentWord =
    phase === 'normal' ? queue[currentIndex] : lapses[currentIndex];

  const handleFlip = useCallback(() => {
    if (!cardState.isFlipped) {
      setCardState((prev) => ({
        ...prev,
        isFlipped: true,
        hasBeenRevealed: true,
      }));
    }
  }, [cardState.isFlipped]);

  const dismissTransition = useCallback(() => {
    setShowLapseTransition(false);
    setStartTime(Date.now());
  }, []);

  const handleRate = useCallback(
    async (grade: ValidGrade) => {
      if (cardState.isSubmitting || !currentWord) return;

      setCardState((prev) => ({ ...prev, isSubmitting: true }));
      const durationMs = Date.now() - startTime;

      try {
        if (!isSimulationMode) {
          await processReview(currentWord.id, grade, durationMs);
        }

        let nextStats = { ...stats };
        let nextLapsesCount = lapses.length;

        if (phase === 'normal') {
          nextStats = {
            ...stats,
            easy: grade === Rating.Easy ? stats.easy + 1 : stats.easy,
            good: grade === Rating.Good ? stats.good + 1 : stats.good,
            hard: grade === Rating.Hard ? stats.hard + 1 : stats.hard,
            again: grade === Rating.Again ? stats.again + 1 : stats.again,
          };
          setStats(nextStats);

          if (grade === Rating.Again) {
            setLapses((prev) => [...prev, currentWord]);
            nextLapsesCount++;
          }
        } else {
          if (grade === Rating.Again) {
            setLapses((prev) => [...prev, currentWord]);
            nextLapsesCount++;
          }
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
      currentWord,
      isSimulationMode,
      phase,
      currentIndex,
      queue.length,
      lapses.length,
      stats,
      startTime,
      router,
      onComplete,
    ],
  );

  return {
    currentWord,
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
    },
  };
};
