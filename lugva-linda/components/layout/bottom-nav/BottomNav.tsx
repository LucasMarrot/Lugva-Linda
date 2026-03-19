'use client';

import { Brain, BarChart3 } from 'lucide-react';
import { BottomNavItem } from '@/components/layout/bottom-nav/BottomNavItem';
import { BottomNavAction } from '@/components/layout/bottom-nav/BottomNavAction';
import { SearchDrawer } from '@/components/search/SearchDrawer';

export const BottomNav = () => {
  return (
    <nav className="border-border bg-background/90 fixed right-0 bottom-0 left-0 z-50 flex h-[var(--bottom-nav-height)] items-center justify-around border-t pb-[var(--safe-area-bottom)] backdrop-blur-md">
      <BottomNavItem href="/" icon={Brain} matchPaths={['/', '/words']} />

      <SearchDrawer>
        <BottomNavAction />
      </SearchDrawer>

      <BottomNavItem href="/stats" icon={BarChart3} />
    </nav>
  );
};
