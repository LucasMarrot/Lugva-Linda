import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
}

export function Spinner({ className, size = 'default', ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        {
          'size-4': size === 'default',
          'size-3': size === 'sm',
          'size-6': size === 'lg',
          'size-10': size === 'xl',
        },
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
