'use client';

import { useCallback, useEffect, useRef } from 'react';

type SwipeDirection = 'prev' | 'next';

type UseSwipeNavigationOptions = {
  onNavigate: (direction: SwipeDirection) => void;
  /** Distance minimale en px pour déclencher le swipe (défaut 50) */
  threshold?: number;
  /** Désactiver la navigation (ex: en mode édition) */
  disabled?: boolean;
};

/**
 * Détecte le swipe tactile (gauche/droite) et les flèches clavier
 * pour déclencher une navigation prev/next.
 *
 * - Swipe gauche → next
 * - Swipe droite → prev
 * - ArrowLeft  → prev
 * - ArrowRight → next
 */
export const useSwipeNavigation = ({
  onNavigate,
  threshold = 50,
  disabled = false,
}: UseSwipeNavigationOptions) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    },
    [disabled],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (
        disabled ||
        touchStartX.current === null ||
        touchStartY.current === null
      )
        return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Ignorer si le mouvement est principalement vertical (scroll)
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      if (Math.abs(deltaX) >= threshold) {
        onNavigate(deltaX < 0 ? 'next' : 'prev');
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [disabled, onNavigate, threshold],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      // Ne pas interférer si le focus est dans un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('next');
      }
    },
    [disabled, onNavigate],
  );

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, handleTouchStart, handleTouchEnd, handleKeyDown]);
};
