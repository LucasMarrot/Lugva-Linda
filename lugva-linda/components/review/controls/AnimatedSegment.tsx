'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SegmentState = 'done' | 'active' | 'normal-pending' | 'lapse-pending';

interface AnimatedSegmentProps {
  state: SegmentState;
  isLapsePhase?: boolean;
}

export const AnimatedSegment = ({
  state,
  isLapsePhase = false,
}: AnimatedSegmentProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'h-2.5 flex-1 rounded-full transition-colors duration-300',
        // Segments terminés
        state === 'done' && !isLapsePhase && 'bg-primary',
        state === 'done' && isLapsePhase && 'bg-destructive/60',
        // Segment actif (mot en cours) — rempli à moitié, sans animation
        state === 'active' && !isLapsePhase && 'bg-primary/20 overflow-hidden',
        state === 'active' &&
          isLapsePhase &&
          'bg-destructive/20 overflow-hidden',
        // Segments en attente
        state === 'normal-pending' &&
          'border-primary/30 border-[1.5px] bg-transparent',
        state === 'lapse-pending' &&
          'border-destructive/50 border-[1.5px] bg-transparent',
      )}
    >
      {state === 'active' && (
        <div
          className={cn(
            'h-full w-1/2 rounded-full',
            !isLapsePhase && 'bg-primary',
            isLapsePhase && 'bg-destructive',
          )}
        />
      )}
    </motion.div>
  );
};
