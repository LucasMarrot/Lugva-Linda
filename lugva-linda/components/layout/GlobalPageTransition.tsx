'use client';

import { useState, useRef } from 'react';
import { TransitionRouter } from 'next-transition-router';
import { motion, useAnimate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { TypoLogo } from '@/components/shared';

export function GlobalPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scope, animate] = useAnimate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLongLoad, setIsLongLoad] = useState(false);
  const longLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveCompletionPromiseRef = useRef<Promise<void> | null>(null);

  return (
    <TransitionRouter
      auto={true}
      leave={async (next, from, to) => {
        if (to && to.startsWith('/search')) {
          next();
          return;
        }

        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
          next();
          return;
        }

        let resolveLeaveCompletion: () => void = () => {};
        leaveCompletionPromiseRef.current = new Promise<void>((resolve) => {
          resolveLeaveCompletion = resolve;
        });

        setIsTransitioning(true);

        if (longLoadTimerRef.current) clearTimeout(longLoadTimerRef.current);
        longLoadTimerRef.current = setTimeout(() => {
          setIsLongLoad(true);
        }, 500);

        // Réinitialisation instantanée des éléments
        await Promise.all([
          animate(
            '#transition-curtain',
            { y: '0%', opacity: 1 },
            { duration: 0 },
          ),
          animate(
            '#transition-path',
            { pathLength: 0, pathOffset: 0, strokeWidth: 5, opacity: 1 },
            { duration: 0 },
          ),
          animate(
            '#transition-content',
            { opacity: 0, scale: 0.94, y: 16 },
            { duration: 0 },
          ),
        ]);

        await new Promise((resolve) => setTimeout(resolve, 20));

        // 1. Traçage de l'éclair signature à travers l'écran
        await animate(
          '#transition-path',
          { pathLength: 1 },
          { duration: 0.3, ease: [0.65, 0, 0.35, 1] },
        );

        // 2. Déclenchement du chargement Next.js en arrière-plan pendant l'inondation de l'écran
        next();

        // 3. Expansion de l'éclair en canevas plein écran et apparition du logo
        await Promise.all([
          animate(
            '#transition-path',
            { strokeWidth: 350 },
            { duration: 0.38, ease: [0.65, 0, 0.35, 1] },
          ),
          animate(
            '#transition-content',
            { opacity: 1, scale: 1, y: 0 },
            { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          ),
        ]);

        // L'écran est désormais 100% opaque avec le logo centré
        resolveLeaveCompletion();
      }}
      enter={async (next) => {
        if (longLoadTimerRef.current) clearTimeout(longLoadTimerRef.current);

        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
          setIsTransitioning(false);
          setIsLongLoad(false);
          next();
          return;
        }

        // 1. Attendre impérativement que leave ait fini de couvrir l'écran (évite tout saut ou flash prématuré)
        if (leaveCompletionPromiseRef.current) {
          await leaveCompletionPromiseRef.current;
        }

        // 2. Disparition élégante du logo vers le haut
        await animate(
          '#transition-content',
          { opacity: 0, scale: 0.94, y: -16 },
          { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
        );

        // 3. Révélation fluide et travaillée de la nouvelle page via balayage ascendant et biseauté
        await animate(
          '#transition-curtain',
          {
            y: '-110%',
            opacity: [1, 1, 0.95, 0],
          },
          {
            duration: 0.48,
            times: [0, 0.65, 0.9, 1],
            ease: [0.76, 0, 0.24, 1],
          },
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
          isTransitioning
            ? 'pointer-events-auto visible'
            : 'pointer-events-none invisible',
        )}
      >
        <div
          id="transition-curtain"
          className="absolute inset-x-0 top-0 h-[calc(100%+40px)] overflow-hidden"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 0 100%)',
            willChange: 'transform, opacity',
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.path
              id="transition-path"
              initial={{
                pathLength: 0,
                pathOffset: 0,
                strokeWidth: 5,
                opacity: 1,
              }}
              d="M 0 100 L 60 50 L 40 50 L 100 0"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-primary"
              strokeWidth="0"
            />
          </svg>
        </div>

        <motion.div
          id="transition-content"
          initial={{ opacity: 0, y: 20 }}
          className="pointer-events-none relative z-10 flex flex-col items-center justify-center opacity-0"
        >
          <TypoLogo className="text-primary-foreground mb-6 h-12 w-auto md:h-16" />
          <div
            className={cn(
              'transition-opacity duration-300',
              isLongLoad ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Spinner size="xl" className="text-primary-foreground" />
          </div>
        </motion.div>
      </div>
    </TransitionRouter>
  );
}
