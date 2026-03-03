import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'low' | 'medium' | 'high' | 'todo' | 'in_progress' | 'done';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        {
          'bg-slate-700 text-slate-300': variant === 'default',
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':
            variant === 'low' || variant === 'done',
          'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'medium',
          'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'high',
          'bg-slate-600/50 text-slate-300 border border-slate-600': variant === 'todo',
          'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'in_progress',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
