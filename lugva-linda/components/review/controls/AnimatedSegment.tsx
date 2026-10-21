'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SegmentState =
  | 'normal-done'
  | 'lapse-done'
  | 'active'
  | 'normal-pending'
  | 'lapse-pending';

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
        'h-2.5 rounded-full transition-colors duration-300',
        // Largeur : actif = 2×, autres = 1×
        state === 'active' ? 'flex-[2]' : 'flex-1',
        // Segments terminés — couleur fixée par leur phase d'origine
        state === 'normal-done' && 'bg-primary',
        state === 'lapse-done' && 'bg-destructive/60',
        // Segment actif — élargi mais creux (se remplit uniquement à la validation)
        state === 'active' &&
          !isLapsePhase &&
          'border-primary bg-primary/20 border-[1.5px]',
        state === 'active' &&
          isLapsePhase &&
          'border-destructive bg-destructive/20 border-[1.5px]',
        // Segments en attente
        state === 'normal-pending' &&
          'border-primary/30 border-[1.5px] bg-transparent',
        state === 'lapse-pending' &&
          'border-destructive/50 border-[1.5px] bg-transparent',
      )}
    />
  );
};
