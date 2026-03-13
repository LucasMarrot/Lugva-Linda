'use client';

import { useState } from 'react';
import { Rating } from 'ts-fsrs';
import { ConfirmButton } from '@/components/shared/ConfirmButton';

type ValidGrade = Exclude<Rating, Rating.Manual>;

interface RatingButtonGroupProps {
  onRate: (grade: ValidGrade) => void;
  disabled?: boolean;
}

export const RatingButtonGroup = ({
  onRate,
  disabled = false,
}: RatingButtonGroupProps) => {
  const [activeGrade, setActiveGrade] = useState<ValidGrade | null>(null);

  const handleConfirmingChange = (grade: ValidGrade, isConfirming: boolean) => {
    if (isConfirming) {
      setActiveGrade(grade);
    } else if (activeGrade === grade) {
      setActiveGrade(null);
    }
  };

  const handleConfirm = (grade: ValidGrade) => {
    setActiveGrade(null);
    onRate(grade);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto grid w-full max-w-md grid-cols-2 gap-3 duration-500 md:grid-cols-4">
      <ConfirmButton
        idleText="Oubli"
        idleVariant="outlineDestructive"
        confirmVariant="destructive"
        isConfirming={activeGrade === Rating.Again}
        onConfirmingChange={(val) => handleConfirmingChange(Rating.Again, val)}
        onConfirm={() => handleConfirm(Rating.Again)}
        disabled={disabled}
      />
      <ConfirmButton
        idleText="Difficile"
        idleVariant="outlineWarning"
        confirmVariant="warning"
        isConfirming={activeGrade === Rating.Hard}
        onConfirmingChange={(val) => handleConfirmingChange(Rating.Hard, val)}
        onConfirm={() => handleConfirm(Rating.Hard)}
        disabled={disabled}
      />
      <ConfirmButton
        idleText="Bon"
        idleVariant="outlinePrimary"
        confirmVariant="default"
        isConfirming={activeGrade === Rating.Good}
        onConfirmingChange={(val) => handleConfirmingChange(Rating.Good, val)}
        onConfirm={() => handleConfirm(Rating.Good)}
        disabled={disabled}
      />
      <ConfirmButton
        idleText="Facile"
        idleVariant="outlineInfo"
        confirmVariant="info"
        isConfirming={activeGrade === Rating.Easy}
        onConfirmingChange={(val) => handleConfirmingChange(Rating.Easy, val)}
        onConfirm={() => handleConfirm(Rating.Easy)}
        disabled={disabled}
      />
    </div>
  );
};
