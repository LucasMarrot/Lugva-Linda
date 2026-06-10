import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'primary' | 'default';
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: StatCardProps) => {
  const isPrimary = variant === 'primary';

  return (
    <Card
      className={cn(
        'transition-all',
        isPrimary
          ? 'bg-primary/10 border-primary/20 text-card-foreground shadow-md'
          : 'bg-card text-card-foreground shadow-sm',
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-5">
        <Icon className="text-primary mb-1 h-7 w-7 opacity-90" />
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        <span
          className={cn(
            'mt-1 text-center text-[10px] font-medium tracking-wider uppercase',
            isPrimary ? 'opacity-80' : 'text-muted-foreground',
          )}
        >
          {title}
        </span>
      </CardContent>
    </Card>
  );
};
