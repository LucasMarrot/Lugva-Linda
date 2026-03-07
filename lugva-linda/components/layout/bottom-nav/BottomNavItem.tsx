'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BottomNavItemProps = {
  href: string
  icon: LucideIcon
}

export const BottomNavItem = ({ href, icon: Icon }: BottomNavItemProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'flex h-full flex-1 flex-col items-center justify-center transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
      )}
    >
      <Icon className="h-6 w-6" />
    </Link>
  )
}
