'use client';

import { useState, useRef } from 'react';
import { TransitionRouter } from 'next-transition-router';
import { motion, useAnimate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { TypoLogo } from '@/components/shared';

export function GlobalPageTransition({ children }: { children: React.ReactNode }) {
  const [scope, animate] = useAnimate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLongLoad, setIsLongLoad] = useState(false);
  const longLoadTimerRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <TransitionRouter
      auto={true}
      leave={async (next, from, to) => {
        if (to && to.startsWith('/search')) {
          next();
          return;
        }

        setIsTransitioning(true);

        longLoadTimerRef.current = setTimeout(() => {
          setIsLongLoad(true);
        }, 500);

        await animate(
          '#transition-path',
          { pathLength: 0, pathOffset: 0, strokeWidth: 5, opacity: 1 },
          { duration: 0 },
        );
        await animate('#transition-content', { opacity: 0, y: 20 }, { duration: 0 });

        await new Promise((resolve) => setTimeout(resolve, 20));

        await animate(
          '#transition-path',
          { pathLength: 1 },
          { duration: 0.3, ease: [0.7, 0, 0.3, 1] },
        );
        await animate(
          '#transition-path',
          { strokeWidth: 300 },
          { duration: 0.4, ease: [0.7, 0, 0.3, 1] },
        );
        animate('#transition-content', { opacity: 1, y: 0 }, { duration: 0.3 });

        next();
      }}
      enter={async (next) => {
        if (longLoadTimerRef.current) clearTimeout(longLoadTimerRef.current);

        await animate('#transition-content', { opacity: 0, y: -20 }, { duration: 0.2 });
        await animate(
          '#transition-path',
          { pathOffset: 1 },
          { duration: 0.5, ease: [0.7, 0, 0.3, 1] },
        );

        setIsTransitioning(false);
        setIsLongLoad(false);
        next();
      }}
    >
      {children}

      <div
        ref={scope}
        className={cn(
          'fixed inset-0 z-[9999] flex items-center justify-center',
          isTransitioning ? 'visible pointer-events-auto' : 'invisible pointer-events-none',
        )}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            id="transition-path"
            initial={{ pathLength: 0, pathOffset: 0, strokeWidth: 5, opacity: 1 }}
            d="M 0 100 L 60 50 L 40 50 L 100 0"
            fill="none"
            className="stroke-primary"
            strokeWidth="0"
          />
        </svg>

        <motion.div
          id="transition-content"
          initial={{ opacity: 0, y: 20 }}
          className="relative z-10 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <TypoLogo className="mb-6 h-12 w-auto text-primary-foreground md:h-16" />
          <div className={cn('transition-opacity duration-300', isLongLoad ? 'opacity-100' : 'opacity-0')}>
            <Spinner size="xl" className="text-primary-foreground" />
          </div>
        </motion.div>
      </div>
    </TransitionRouter>
  );
}
