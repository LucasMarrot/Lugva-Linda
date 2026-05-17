'use client';

import { Badge } from '@/components/ui';
import { RatingRevealMotion } from '../../controls/RatingRevealMotion';
import { ValidGrade } from '@/lib/validation/schemas';
import { getGradeUI } from './spelling-utils';

type SpellingHeaderProps = {
  isFinished: boolean;
  hasBeenRevealed: boolean;
  finalGrade: ValidGrade | null;
  attempts: string[];
  mode?: string;
};

export const SpellingHeader = ({
  isFinished,
  hasBeenRevealed,
  finalGrade,
  attempts,
  mode,
}: SpellingHeaderProps) => {
  return (
    <div className="flex flex-col items-center justify-end gap-2 pb-2">
      <RatingRevealMotion isVisible={hasBeenRevealed}>
        {finalGrade && mode !== 'PRACTICE' && (
          <Badge variant={getGradeUI(finalGrade).variant}>
            {getGradeUI(finalGrade).label}
          </Badge>
        )}
      </RatingRevealMotion>

      {!isFinished && attempts.length > 0 && (
        <div className="flex min-h-8 flex-wrap items-end justify-center gap-2">
          {attempts.map((attempt, idx) => (
            <Badge
              key={idx}
              variant="destructiveOutline"
              className="line-through"
            >
              {attempt}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
