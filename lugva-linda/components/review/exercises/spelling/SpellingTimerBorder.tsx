'use client';

import { motion } from 'framer-motion';

type SpellingTimerBorderProps = {
  duration?: number;
  initialColor?: string;
  finalColor?: string;
};

export const SpellingTimerBorder = ({
  duration = 15.5,
  initialColor = '#10b981', // Vert émeraude
  finalColor = '#3b82f6', // Bleu azur
}: SpellingTimerBorderProps) => {
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
        initial={{ pathLength: 1, stroke: initialColor }}
        animate={{ pathLength: 0, stroke: finalColor }}
        transition={{
          pathLength: { duration, ease: 'linear' },
          stroke: {
            duration: duration / 4,
            delay: (duration * 3) / 4,
            ease: 'easeInOut',
          },
        }}
      />
    </svg>
  );
};
