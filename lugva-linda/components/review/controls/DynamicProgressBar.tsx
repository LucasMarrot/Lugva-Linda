'use client';

import { AnimatedSegment } from './AnimatedSegment';
import { cn } from '@/lib/utils';

interface DynamicProgressBarProps {
  initialCount: number;
  lapsesCount: number;
  activeSegmentIndex: number;
  isLapsePhase?: boolean;
}

export const DynamicProgressBar = ({
  initialCount,
  lapsesCount,
  activeSegmentIndex,
  isLapsePhase = false,
}: DynamicProgressBarProps) => {
  const totalSegments = initialCount + lapsesCount;

  type SegmentState = 'done' | 'active' | 'normal-pending' | 'lapse-pending';

  const segments: SegmentState[] = Array.from({ length: totalSegments }).map(
    (_, i) => {
      if (i === activeSegmentIndex) return 'active';
      if (i < activeSegmentIndex) return 'done';
      if (i < initialCount) return 'normal-pending';
      return 'lapse-pending';
    },
  );

  return (
    <div className="flex w-full flex-col gap-2 px-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span
          className={cn(
            'transition-colors duration-300',
            isLapsePhase ? 'text-destructive' : 'text-primary',
          )}
        >
          {activeSegmentIndex + 1} / {totalSegments} mots
        </span>
        {isLapsePhase && (
          <span className="text-destructive text-xs font-semibold tracking-wide uppercase">
            Consolidation
          </span>
        )}
      </div>

      <div className="flex h-2.5 w-full gap-1">
        {segments.map((state, index) => (
          <AnimatedSegment
            key={index}
            state={state}
            isLapsePhase={isLapsePhase}
          />
        ))}
      </div>
    </div>
  );
};
