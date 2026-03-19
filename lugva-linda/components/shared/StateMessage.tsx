import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

type StateMessageTone = 'neutral' | 'info' | 'success' | 'error';

type StateMessageProps = {
  title?: string;
  message: string;
  tone?: StateMessageTone;
  className?: string;
};

const toneStyles: Record<StateMessageTone, string> = {
  neutral: 'bg-muted/30 text-muted-foreground border-border/50',
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
};

const toneIcon = {
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
} as const;

export const StateMessage = ({
  title,
  message,
  tone = 'neutral',
  className,
}: StateMessageProps) => {
  const Icon = toneIcon[tone];
  const hasTitle = typeof title === 'string' && title.trim().length > 0;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border p-3 text-sm',
        'flex items-start gap-2',
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        {hasTitle && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  );
};
