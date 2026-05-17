'use client';

import { motion } from 'framer-motion';

export const SpellingTimerBorder = () => {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      style={{ borderRadius: 'inherit' }}
    >
      <motion.rect
        x="0"
        y="0"
        width="calc(100%)"
        height="calc(100%)"
        fill="none"
        rx="calc(var(--radius) + 4px)"
        strokeWidth="4"
        initial={{ pathLength: 1, stroke: '#10b981' }} // Vert
        animate={{ pathLength: 0, stroke: '#3b82f6' }} // Bleu
        transition={{
          pathLength: { duration: 15.5, ease: 'linear' },
          stroke: { duration: 4, delay: 12, ease: 'easeInOut' },
        }}
      />
    </svg>
  );
};
