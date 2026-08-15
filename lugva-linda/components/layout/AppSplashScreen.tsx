'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypoLogo } from '@/components/shared';

interface AppSplashScreenProps {
  children: React.ReactNode;
}

// Particules discrètes réparties UNIQUEMENT autour du logo (pourtour et bords de l'écran)
const PERIMETER_PARTICLES = [
  // Bande haute
  { id: 't1', top: '8%', left: '12%', size: 2.5, duration: 3.2, delay: 0.1, driftY: -8, driftX: 5 },
  { id: 't2', top: '14%', left: '30%', size: 2, duration: 3.5, delay: 0.25, driftY: -10, driftX: 6 },
  { id: 't3', top: '10%', left: '50%', size: 2.5, duration: 3.0, delay: 0.4, driftY: -9, driftX: -5 },
  { id: 't4', top: '15%', left: '70%', size: 2, duration: 3.3, delay: 0.2, driftY: -11, driftX: 4 },
  { id: 't5', top: '8%', left: '88%', size: 3, duration: 2.8, delay: 0.35, driftY: -8, driftX: -6 },

  // Flanc gauche (bien à l'écart du centre)
  { id: 'l1', top: '28%', left: '8%', size: 2.5, duration: 3.4, delay: 0.15, driftY: -12, driftX: 6 },
  { id: 'l2', top: '42%', left: '14%', size: 2, duration: 2.9, delay: 0.3, driftY: -10, driftX: 5 },
  { id: 'l3', top: '56%', left: '7%', size: 3, duration: 3.1, delay: 0.2, driftY: -14, driftX: 7 },
  { id: 'l4', top: '70%', left: '15%', size: 2, duration: 3.3, delay: 0.45, driftY: -9, driftX: 4 },

  // Flanc droit (bien à l'écart du centre)
  { id: 'r1', top: '28%', left: '90%', size: 2.5, duration: 3.0, delay: 0.25, driftY: -11, driftX: -6 },
  { id: 'r2', top: '44%', left: '84%', size: 3, duration: 2.7, delay: 0.1, driftY: -9, driftX: -5 },
  { id: 'r3', top: '58%', left: '92%', size: 2, duration: 3.6, delay: 0.4, driftY: -13, driftX: -7 },
  { id: 'r4', top: '70%', left: '83%', size: 2.5, duration: 2.9, delay: 0.3, driftY: -10, driftX: -4 },

  // Bande basse
  { id: 'b1', top: '86%', left: '10%', size: 2.5, duration: 3.1, delay: 0.15, driftY: -10, driftX: 6 },
  { id: 'b2', top: '90%', left: '32%', size: 2, duration: 3.4, delay: 0.35, driftY: -8, driftX: 5 },
  { id: 'b3', top: '88%', left: '50%', size: 2.5, duration: 3.2, delay: 0.2, driftY: -11, driftX: -5 },
  { id: 'b4', top: '91%', left: '68%', size: 2, duration: 2.8, delay: 0.4, driftY: -9, driftX: 6 },
  { id: 'b5', top: '86%', left: '88%', size: 3, duration: 3.0, delay: 0.25, driftY: -12, driftX: -6 },
];

// Particules cinétiques extérieures accompagnant le "L" gauche (dans le quart bas-gauche de la page, restant HORS du logo)
const OUTER_LEFT_FLOW = [
  { id: 'olf1', startX: -260, startY: 190, midX: -180, midY: 130, endX: -130, endY: 90, delay: 0.05, size: 3 },
  { id: 'olf2', startX: -240, startY: 220, midX: -160, midY: 150, endX: -110, endY: 110, delay: 0.1, size: 2.5 },
  { id: 'olf3', startX: -290, startY: 170, midX: -200, midY: 120, endX: -150, endY: 80, delay: 0.15, size: 2 },
  { id: 'olf4', startX: -220, startY: 240, midX: -150, midY: 170, endX: -100, endY: 120, delay: 0.2, size: 2.5 },
  { id: 'olf5', startX: -270, startY: 210, midX: -190, midY: 140, endX: -140, endY: 100, delay: 0.25, size: 2 },
];

// Particules cinétiques extérieures accompagnant le "L" droit (dans le quart haut-droit de la page, restant HORS du logo)
const OUTER_RIGHT_FLOW = [
  { id: 'orf1', startX: 260, startY: -190, midX: 180, midY: -130, endX: 130, endY: -90, delay: 0.07, size: 3 },
  { id: 'orf2', startX: 240, startY: -220, midX: 160, midY: -150, endX: 110, endY: -110, delay: 0.12, size: 2.5 },
  { id: 'orf3', startX: 290, startY: -170, midX: 200, midY: -120, endX: 150, endY: -80, delay: 0.17, size: 2 },
  { id: 'orf4', startX: 220, startY: -240, midX: 150, midY: -170, endX: 100, endY: -120, delay: 0.22, size: 2.5 },
  { id: 'orf5', startX: 270, startY: -210, midX: 190, midY: -140, endX: 140, endY: -100, delay: 0.27, size: 2 },
];

export function AppSplashScreen({ children }: AppSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1550);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="app-splash-screen"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.02,
              filter: 'blur(8px)',
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
            }}
            className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-background select-none overflow-hidden"
            aria-label="Chargement de Lugva Linda"
          >
            {/* Particules d'ambiance discrètes sur le pourtour de l'écran (autour du logo, jamais dedans) */}
            {PERIMETER_PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.4, 0.2, 0.35, 0.15],
                  y: [0, p.driftY, 0],
                  x: [0, p.driftX, 0],
                  scale: [0, 1, 0.9, 1.1, 0.8],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
                style={{
                  top: p.top,
                  left: p.left,
                  width: p.size,
                  height: p.size,
                }}
                className="pointer-events-none absolute rounded-full bg-foreground/25 dark:bg-primary-foreground/35"
              />
            ))}

            {/* Particules de flux cinétique dans l'espace périphérique bas-gauche (hors du logo) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {OUTER_LEFT_FLOW.map((tp) => (
                <motion.div
                  key={tp.id}
                  initial={{
                    x: tp.startX,
                    y: tp.startY,
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    x: [tp.startX, tp.midX, tp.endX],
                    y: [tp.startY, tp.midY, tp.endY],
                    opacity: [0, 0.55, 0.35, 0],
                    scale: [0.5, 1.1, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.7,
                    delay: tp.delay,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: tp.size,
                    height: tp.size,
                  }}
                  className="absolute rounded-full bg-primary/80 shadow-[0_0_6px_var(--primary)]"
                />
              ))}

              {/* Particules de flux cinétique dans l'espace périphérique haut-droit (hors du logo) */}
              {OUTER_RIGHT_FLOW.map((tp) => (
                <motion.div
                  key={tp.id}
                  initial={{
                    x: tp.startX,
                    y: tp.startY,
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    x: [tp.startX, tp.midX, tp.endX],
                    y: [tp.startY, tp.midY, tp.endY],
                    opacity: [0, 0.55, 0.35, 0],
                    scale: [0.5, 1.1, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.7,
                    delay: tp.delay,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: tp.size,
                    height: tp.size,
                  }}
                  className="absolute rounded-full bg-primary/80 shadow-[0_0_6px_var(--primary)]"
                />
              ))}
            </div>

            {/* Halo lumineux d'ambiance doux et subtil */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.35, 0.2], scale: [0.8, 1.2, 1] }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="pointer-events-none absolute h-96 w-96 rounded-full bg-primary/15 blur-3xl -translate-y-4"
            />

            {/* Conteneur central Logo & Typo (100% net, propre et dégagé) */}
            <div className="relative z-20 flex flex-col items-center justify-center px-4">
              {/* PictoLogo avec convergence fluide et éclair en espace négatif */}
              <div className="relative mb-7 h-24 w-32 sm:h-28 sm:w-36 flex items-center justify-center">
                <svg
                  viewBox="0 0 201.07 155.52"
                  className="h-full w-full overflow-visible"
                  fill="none"
                >
                  {/* Facette gauche / inférieure */}
                  <motion.path
                    d="m108.9,89.8l-9.66,45.17H14.02c-10.09,0-16.87-10.36-12.83-19.61L47.88,8.4c2.23-5.1,7.27-8.4,12.83-8.4h46.18l-49.27,89.8h51.27Z"
                    className="fill-primary"
                    initial={{
                      x: -32,
                      y: 24,
                      opacity: 0,
                      scale: 0.92,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 190,
                      damping: 22,
                      mass: 1,
                      delay: 0.08,
                    }}
                  />

                  {/* Facette droite / supérieure */}
                  <motion.path
                    d="m92.16,65.72l9.66-45.17h85.22c10.09,0,16.87,10.36,12.83,19.61l-46.7,106.96c-2.23,5.1-7.27,8.4-12.83,8.4h-46.18l49.27-89.8h-51.27Z"
                    className="fill-primary"
                    initial={{
                      x: 32,
                      y: -24,
                      opacity: 0,
                      scale: 0.92,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 190,
                      damping: 22,
                      mass: 1,
                      delay: 0.12,
                    }}
                  />

                  {/* ÉCLAIR EN ESPACE NÉGATIF : Noir en mode clair, Blanc en mode sombre */}
                  <motion.path
                    d="M 106.89 0 L 101.82 20.55 L 92.16 65.72 L 143.43 65.72 L 94.16 155.52 L 99.24 134.97 L 108.9 89.8 L 57.62 89.8 Z"
                    className="fill-black dark:fill-white filter drop-shadow-[0_0_10px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_0_12px_#ffffff] drop-shadow-[0_0_20px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_0_24px_#ffffff] dark:drop-shadow-[0_0_45px_rgba(255,255,255,0.9)]"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0.45, 1, 0.9, 0.15, 0],
                    }}
                    transition={{
                      duration: 0.65,
                      delay: 0.35,
                      times: [0, 0.18, 0.4, 0.65, 0.82, 0.94, 1],
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Ligne directrice de lumière au cœur de l'éclair */}
                  <motion.path
                    d="M 104.3 0 L 74.9 77.76 L 126.15 77.76 L 96.7 155.52"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="stroke-black dark:stroke-white filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0_10px_#ffffff] dark:drop-shadow-[0_0_22px_#ffffff]"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: [0, 1, 1, 0],
                      opacity: [0, 1, 0.9, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.35,
                      ease: 'easeInOut',
                    }}
                  />
                </svg>

                {/* Halo de scintillement : sombre en mode clair, blanc éclatant en mode sombre */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: [0, 0.95, 0.7, 0.9, 0],
                    scale: [0.3, 1.4, 1.2, 1.7, 2.0],
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 0.36,
                    ease: 'easeOut',
                  }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div className="h-20 w-20 rounded-full bg-black/75 dark:bg-white blur-xl shadow-[0_0_35px_rgba(0,0,0,0.5)] dark:shadow-[0_0_35px_#ffffff]" />
                </motion.div>
              </div>

              {/* Révélation élégante du logo typographique */}
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.42,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col items-center"
              >
                <TypoLogo className="h-8 sm:h-10 w-auto text-foreground tracking-wide" />
              </motion.div>

              {/* Ligne de chargement minimaliste et soignée */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ delay: 0.35, duration: 0.25 }}
                className="mt-6 h-[2px] w-28 sm:w-36 overflow-hidden rounded-full bg-muted/60"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{
                    duration: 0.9,
                    delay: 0.38,
                    ease: [0.65, 0, 0.35, 1],
                  }}
                  className="h-full w-full rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
