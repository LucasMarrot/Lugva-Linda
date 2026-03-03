import { clsx } from 'clsx';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <select
        className={clsx(
          'px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm transition-colors focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer',
          { 'border-red-500': error },
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
