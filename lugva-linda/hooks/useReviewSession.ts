import { useState } from 'react';
import type { Word } from '@prisma/client';
import { Rating } from 'ts-fsrs';

export type ValidGrade = Exclude<Rating, Rating.Manual>;

export interface SessionStats {
  easy: number;
  good: number;
  hard: number;
}

export const useReviewSession = (
  initialWords: Word[],
  onComplete: (stats: SessionStats) => void,
) => {
  const [sessionWords, setSessionWords] = useState<Word[]>(initialWords);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);
  const [hasBeenRevealed, setHasBeenRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLapseTransition, setShowLapseTransition] = useState(false);
  const [finalRatings, setFinalRatings] = useState<Record<string, ValidGrade>>(
    {},
  );

  const currentWord = sessionWords[currentIndex];
  const initialCount = initialWords.length;
  const lapsesCount = sessionWords.length - initialCount;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!hasBeenRevealed) setHasBeenRevealed(true);
  };

  const handleRate = async (grade: ValidGrade) => {
    if (!currentWord || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // TODO : remplacer ce timeout par un appel API réel pour enregistrer la réponse de l'utilisateur
      // Simulation réseau (ou futur appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isAgain = grade === Rating.Again;
      const nextQueueLength = isAgain
        ? sessionWords.length + 1
        : sessionWords.length;

      const currentFinalRatings = { ...finalRatings };
      if (!isAgain) {
        currentFinalRatings[currentWord.id] = grade;
        setFinalRatings(currentFinalRatings);
      }

      if (isAgain) {
        setSessionWords((prev) => [...prev, currentWord]);
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex >= nextQueueLength) {
        const finalStats = { easy: 0, good: 0, hard: 0 };
        Object.values(currentFinalRatings).forEach((g) => {
          if (g === Rating.Easy) finalStats.easy++;
          else if (g === Rating.Good) finalStats.good++;
          else if (g === Rating.Hard) finalStats.hard++;
        });
        onComplete(finalStats);
      } else {
        if (nextIndex === initialCount && nextQueueLength > initialCount) {
          setShowLapseTransition(true);
        }
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        setHasBeenRevealed(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissTransition = () => setShowLapseTransition(false);

  return {
    currentWord,
    progress: { initialCount, currentIndex, lapsesCount },
    cardState: { isFlipped, hasBeenRevealed, isSubmitting },
    showLapseTransition,
    actions: { handleFlip, handleRate, dismissTransition },
  };
};
