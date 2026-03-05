'use client'

import { Brain, BarChart3 } from 'lucide-react'
import { BottomNavItem } from '@/components/layout/bottom-nav/BottomNavItem'
import { BottomNavAction } from '@/components/layout/bottom-nav/BottomNavAction'
import { SearchDrawer } from '@/components/search/SearchDrawer'

export const BottomNav = () => {
  return (
    <nav className="border-border bg-background/90 pb-safe fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t p-3 backdrop-blur-md">
      <BottomNavItem href="/" icon={Brain} />

      <SearchDrawer>
        <BottomNavAction />
      </SearchDrawer>

      <BottomNavItem href="/stats" icon={BarChart3} />
    </nav>
  )
}
