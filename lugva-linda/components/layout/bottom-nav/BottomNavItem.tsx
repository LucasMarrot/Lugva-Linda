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
        'flex flex-col items-center gap-1 transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-6 w-6" />
    </Link>
  )
}
