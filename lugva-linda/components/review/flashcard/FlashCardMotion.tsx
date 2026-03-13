'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type FlashcardMotionProps = {
  isFlipped: boolean;
  onFlip: () => void;
  children: ReactNode;
};

export const FlashcardMotion = ({
  isFlipped,
  onFlip,
  children,
}: FlashcardMotionProps) => {
  return (
    <motion.div
      layout
      className="relative mx-auto aspect-square w-full max-w-sm cursor-pointer"
      onClick={onFlip}
    >
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
