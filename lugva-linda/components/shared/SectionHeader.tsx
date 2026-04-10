import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  variant?: 'foreground' | 'muted';
};

export const SectionHeader = ({
  title,
  description,
  className,
  variant = 'muted',
}: SectionHeaderProps) => {
  return (
    <div className={cn('flex w-full justify-between gap-1', className)}>
      <h2
        className={cn('text-xs font-medium tracking-wide uppercase', {
          'text-muted-foreground': variant === 'muted',
          'text-foreground': variant === 'foreground',
        })}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn('text-xs font-normal', {
            'text-muted-foreground': variant === 'muted',
            'text-foreground': variant === 'foreground',
          })}
        >
          {description}
        </p>
      )}
    </div>
  );
};
