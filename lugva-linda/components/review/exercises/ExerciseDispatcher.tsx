'use client';

import { ReviewCard, ValidGrade } from '@/lib/validation/schemas';
import { CardState } from '@/hooks/useReviewSession';
import { RecognitionExercise } from './RecognitionExercise';
import { SpellingExercise } from './SpellingExercise';
import { AudioLines, Brain, PenTool } from 'lucide-react';

export type ExerciseConfig = {
  label: string;
  instruction: string;
  icon: React.ReactNode;
};

export const getExerciseConfig = (type: string): ExerciseConfig => {
  switch (type) {
    case 'RECOGNITION':
      return {
        label: 'Mémorisation',
        instruction: 'Trouve la traduction de ce mot',
        icon: <Brain />,
      };
    case 'REVERSE':
      return {
        label: 'Mémorisation',
        instruction: 'Trouve le mot correspondant à cette traduction',
        icon: <Brain />,
      };
    case 'SPELLING':
      return {
        label: 'Écriture',
        instruction: 'Écris la traduction de ce mot',
        icon: <PenTool />,
      };
    case 'SPEAKING':
      return {
        label: 'Prononciation',
        instruction: 'Prononce ce mot à voix haute',
        icon: <AudioLines />,
      };
    default:
      return {
        label: 'Exercice',
        instruction: 'Fais de ton mieux',
        icon: null,
      };
  }
};

type ExerciseDispatcherProps = {
  card: ReviewCard;
  cardState: CardState;
  mode?: string;
  actions: {
    handleFlip: () => void;
    handleRate: (grade: ValidGrade) => void;
    handleNext: () => void;
    dismissTransition: () => void;
  };
};

export const ExerciseDispatcher = ({
  card,
  cardState,
  mode,
  actions,
}: ExerciseDispatcherProps) => {
  switch (card.type) {
    case 'RECOGNITION':
    case 'REVERSE':
      return (
        <RecognitionExercise
          card={card}
          cardState={cardState}
          onFlip={actions.handleFlip}
          onRate={actions.handleRate}
          onNext={actions.handleNext}
          mode={mode}
        />
      );

    case 'SPELLING':
      return (
        <SpellingExercise
          card={card}
          cardState={cardState}
          onFlip={actions.handleFlip}
          onRate={actions.handleRate}
          onNext={actions.handleNext}
          mode={mode}
        />
      );

    case 'SPEAKING':
      return (
        <div className="border-primary/50 flex h-64 items-center justify-center rounded-xl border-2 border-dashed">
          <p className="text-muted-foreground">
            {'Exercice oral en construction...'}
          </p>
        </div>
      );

    default:
      return <p>{"Type d'exercice inconnu."}</p>;
  }
};
