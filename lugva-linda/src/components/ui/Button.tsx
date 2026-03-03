import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-lg shadow-primary-600/25':
            variant === 'primary',
          'bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 border border-slate-600':
            variant === 'secondary',
          'hover:bg-slate-800 text-slate-300 hover:text-slate-100': variant === 'ghost',
          'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-600/25':
            variant === 'danger',
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-5 py-2.5 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
