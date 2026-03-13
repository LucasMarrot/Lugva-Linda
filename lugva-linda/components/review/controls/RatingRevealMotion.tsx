'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

type RatingRevealMotionProps = {
  isVisible: boolean;
  children: ReactNode;
};

export const RatingRevealMotion = ({
  isVisible,
  children,
}: RatingRevealMotionProps) => {
  return (
    <AnimatePresence mode="popLayout">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="mt-2 flex w-full justify-center"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
