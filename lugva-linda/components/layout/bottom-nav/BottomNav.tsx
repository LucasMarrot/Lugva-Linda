'use client';

import { Brain, BarChart3, BookOpen } from 'lucide-react';
import { BottomNavItem } from '@/components/layout/bottom-nav/BottomNavItem';
import { BottomNavSearchLink } from '@/components/layout/bottom-nav/BottomNavSearchLink';

export const BottomNav = () => {
  return (
    <nav className="border-border bg-background/90 fixed right-0 bottom-0 left-0 z-50 flex h-(--bottom-nav-height) items-center justify-around border-t pb-(--safe-area-bottom) backdrop-blur-md">
      <BottomNavItem href="/" icon={Brain} text="Dashboard" />

      <BottomNavItem href="/words" icon={BookOpen} text="Encyclopédie" />
      <BottomNavSearchLink />

      <BottomNavItem href="/stats" icon={BarChart3} text="Statistiques" />
    </nav>
  );
};
