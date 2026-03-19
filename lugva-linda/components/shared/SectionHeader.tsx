import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export const SectionHeader = ({
  title,
  description,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn('space-y-1', className)}>
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
};
