'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedSegmentProps {
  state: 'done' | 'normal-pending' | 'lapse-pending';
}

export const AnimatedSegment = ({ state }: AnimatedSegmentProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'h-2.5 flex-1 rounded-full transition-colors duration-300',
        state === 'done' && 'bg-primary',
        state === 'normal-pending' &&
          'border-primary/30 border-[1.5px] bg-transparent',
        state === 'lapse-pending' &&
          'border-destructive border-[1.5px] bg-transparent',
      )}
    />
  );
};
