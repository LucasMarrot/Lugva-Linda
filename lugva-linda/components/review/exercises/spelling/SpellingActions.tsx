'use client';

import { ConfirmButton } from '@/components/shared';
import { Button } from '@/components/ui';
import { NextButton } from '../../controls/NextButton';
import { RatingRevealMotion } from '../../controls/RatingRevealMotion';

type SpellingActionsProps = {
  isFinished: boolean;
  hasBeenRevealed: boolean;
  isSubmitting: boolean;
  onGiveUp: () => void;
  onNextAction: () => void;
  mode?: string;
};

export const SpellingActions = ({
  isFinished,
  hasBeenRevealed,
  isSubmitting,
  onGiveUp,
  onNextAction,
  mode,
}: SpellingActionsProps) => {
  const isPractice = mode === 'PRACTICE';

  return (
    <div className="mt-4 flex min-h-14 w-full flex-col items-center justify-center gap-4">
      {!isFinished &&
        (isPractice ? (
          <Button variant="secondary" onClick={onGiveUp}>
            Voir la réponse
          </Button>
        ) : (
          <ConfirmButton
            idleText="Oubli"
            idleVariant="outlineDestructive"
            confirmVariant="destructive"
            onConfirm={onGiveUp}
          />
        ))}

      <RatingRevealMotion isVisible={hasBeenRevealed}>
        <div className="w-full">
          <NextButton onClick={onNextAction} disabled={isSubmitting} />
        </div>
      </RatingRevealMotion>
    </div>
  );
};
