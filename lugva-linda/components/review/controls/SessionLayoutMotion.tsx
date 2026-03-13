'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type SessionLayoutMotionProps = {
  children: ReactNode;
};

export const SessionLayoutMotion = ({ children }: SessionLayoutMotionProps) => {
  return (
    <motion.div layout className="flex w-full flex-col items-center gap-4">
      {children}
    </motion.div>
  );
};
