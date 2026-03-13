'use client';

import { AnimatedSegment } from './AnimatedSegment';
import { cn } from '@/lib/utils';

interface DynamicProgressBarProps {
  initialCount: number;
  currentIndex: number;
  lapsesCount: number;
}

export const DynamicProgressBar = ({
  initialCount,
  currentIndex,
  lapsesCount,
}: DynamicProgressBarProps) => {
  const totalSegments = initialCount + lapsesCount;
  const isLapseZone = currentIndex >= initialCount;

  const segments = Array.from({ length: totalSegments }).map((_, i) => {
    if (i < currentIndex) return 'done';
    if (i < initialCount) return 'normal-pending';
    return 'lapse-pending';
  });

  return (
    <div className="flex w-full flex-col gap-2 px-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span
          className={cn(
            'transition-colors duration-300',
            isLapseZone ? 'text-destructive' : 'text-primary',
          )}
        >
          {currentIndex} / {totalSegments} mots
        </span>
      </div>

      <div className="flex h-2.5 w-full gap-1">
        {segments.map((state, index) => (
          <AnimatedSegment
            key={index}
            state={state as 'done' | 'normal-pending' | 'lapse-pending'}
          />
        ))}
      </div>
    </div>
  );
};
