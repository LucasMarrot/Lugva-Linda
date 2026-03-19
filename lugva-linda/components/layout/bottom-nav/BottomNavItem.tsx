'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type BottomNavItemProps = {
  href: string;
  icon: LucideIcon;
  matchPaths?: string[];
};

export const BottomNavItem = ({
  href,
  icon: Icon,
  matchPaths = [],
}: BottomNavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || matchPaths.includes(pathname);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'ui-motion-interactive ui-tap-feedback flex h-full flex-1 flex-col items-center justify-center',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
      )}
    >
      <Icon className="h-6 w-6" />
    </Link>
  );
};
