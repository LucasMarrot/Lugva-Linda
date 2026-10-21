import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Rating } from 'ts-fsrs';
import { processReview } from '@/actions/review-actions';
import { ReviewCard } from '@/lib/validation/schemas';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

const INITIAL_CARD_STATE: CardState = {
  isFlipped: false,
  hasBeenRevealed: false,
  isSubmitting: false,
};

export const useReviewSession = (
  initialCards: ReviewCard[],
  onComplete: (stats: SessionStats) => void,
  isSimulationMode: boolean = false,
) => {
  const router = useRouter();

  // La queue initiale est mélangée une seule fois au montage
  const [queue] = useState<ReviewCard[]>(() =>
    shuffleArray(initialCards || []),
  );

  /**
   * pendingLapses : file des mots à consolider.
   * - En phase normale, les mots notés "Again" y sont ajoutés.
   * - En phase lapses, le mot est retiré si validé (tout grade ≠ Again),
   *   ou remis à la fin si noté "Again" à nouveau.
   * Quand cette file est vide et que la phase normale est terminée → onComplete.
   */
  const [pendingLapses, setPendingLapses] = useState<ReviewCard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'normal' | 'lapses'>('normal');
  const [showLapseTransition, setShowLapseTransition] = useState(false);
  // Nombre de lapses définitivement validés (pour l'index de la barre)
  const [validatedLapsesCount, setValidatedLapsesCount] = useState(0);
  // Nombre total de lapses créés (pour garder lapsesCount stable)
  const [totalLapsesCreated, setTotalLapsesCreated] = useState(0);

  const [cardState, setCardState] = useState<CardState>(INITIAL_CARD_STATE);
  const [stats, setStats] = useState<SessionStats>({
    easy: 0,
    good: 0,
    hard: 0,
    again: 0,
  });
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const currentCard =
    phase === 'normal' ? queue[currentIndex] : pendingLapses[0];

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

  const resetCard = useCallback(() => {
    setCardState(INITIAL_CARD_STATE);
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

        // Mise à jour des stats
        const nextStats = { ...stats };
        if (grade === Rating.Again) nextStats.again += 1;
        if (grade === Rating.Hard) nextStats.hard += 1;
        if (grade === Rating.Good) nextStats.good += 1;
        if (grade === Rating.Easy) nextStats.easy += 1;
        setStats(nextStats);

        if (phase === 'normal') {
          // Phase normale — gestion des lapses
          let nextLapses = pendingLapses;
          if (grade === Rating.Again) {
            // Ajouter ce mot en file de consolidation
            nextLapses = [...pendingLapses, currentCard];
            setPendingLapses(nextLapses);
            setTotalLapsesCreated((prev) => prev + 1);
          }

          const hasMoreNormalCards = currentIndex + 1 < queue.length;

          if (hasMoreNormalCards) {
            // Passer à la carte normale suivante
            setCurrentIndex((prev) => prev + 1);
            resetCard();
          } else if (nextLapses.length > 0) {
            // Phase normale terminée, lancer la consolidation
            setPhase('lapses');
            setShowLapseTransition(true);
            resetCard();
          } else {
            // Tout validé, aucun lapse
            if (!isSimulationMode) router.refresh();
            onComplete(nextStats);
          }
        } else {
          // Phase lapses — pendingLapses[0] est toujours le mot en cours
          if (grade === Rating.Again) {
            // Mot non maîtrisé : remettre en queue, rester sur le même segment
            const [head, ...rest] = pendingLapses;
            setPendingLapses([...rest, head]);
            resetCard();
          } else {
            // Mot maîtrisé : le retirer et avancer le segment actif
            const [, ...rest] = pendingLapses;
            setPendingLapses(rest);
            setValidatedLapsesCount((prev) => prev + 1);

            if (rest.length === 0) {
              // Tous les lapses sont consolidés → fin de session
              if (!isSimulationMode) router.refresh();
              onComplete(nextStats);
            } else {
              // Il reste des lapses à consolider
              resetCard();
            }
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
      pendingLapses,
      stats,
      startTime,
      router,
      onComplete,
      resetCard,
    ],
  );

  const handleNext = useCallback(() => {
    if (phase === 'normal') {
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        resetCard();
      } else if (pendingLapses.length > 0) {
        setPhase('lapses');
        setShowLapseTransition(true);
        resetCard();
      } else {
        if (!isSimulationMode) router.refresh();
        onComplete(stats);
      }
    } else {
      // En phase lapses, "Suivant" sans notation retire le mot (traité comme validé)
      const [, ...rest] = pendingLapses;
      setPendingLapses(rest);
      if (rest.length === 0) {
        if (!isSimulationMode) router.refresh();
        onComplete(stats);
      } else {
        resetCard();
      }
    }
  }, [
    phase,
    currentIndex,
    queue.length,
    pendingLapses,
    isSimulationMode,
    router,
    onComplete,
    stats,
    resetCard,
  ]);

  // Calcul de la progression pour la barre d'avancement
  // En phase normale : le segment actif est la carte en cours (currentIndex)
  // En phase lapses : tous les segments normaux sont "done",
  //   activeSegmentIndex = queue.length + validatedLapsesCount
  //   (le mot reste sur le même segment tant qu'il est noté "Again")
  const activeSegmentIndex =
    phase === 'normal' ? currentIndex : queue.length + validatedLapsesCount;

  return {
    currentCard,
    phase,
    progress: {
      initialCount: queue.length,
      lapsesCount: totalLapsesCreated,
      activeSegmentIndex,
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
