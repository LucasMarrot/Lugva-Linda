import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

type PlayerScorePanelProps = {
  name: string;
  score: number;
  streak: number;
  color: string;
  align?: 'left' | 'right';
};

const getMultiplier = (streak: number) =>
  streak > 1 ? 1 + (streak - 1) * 0.2 : 1;

const formatMultiplier = (streak: number) =>
  getMultiplier(streak).toFixed(1).replace('.', ',');

export const PlayerScorePanel = ({
  name,
  score,
  streak,
  color,
  align = 'left',
}: PlayerScorePanelProps) => {
  const isRight = align === 'right';

  return (
    <div
      className={cn(
        'relative flex min-w-17.5 flex-col gap-0.5',
        isRight ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn('flex items-center gap-2', isRight && 'flex-row-reverse')}
      >
        <span
          className="text-[10px] font-bold tracking-wider uppercase opacity-80"
          style={{ color }}
        >
          {name}
        </span>

        {streak > 1 && (
          <span
            className={cn(
              'animate-in zoom-in absolute -bottom-8 flex items-center justify-center rounded-md border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-orange-500 shadow-sm duration-300',
              streak >= 3 && 'animate-pulse',
              isRight ? 'right-0' : 'left-0',
            )}
            style={{
              boxShadow: streak >= 3 ? `0 0 12px rgba(249,115,22,0.6)` : 'none',
            }}
          >
            <Flame className="mr-0.5 h-4 w-4" /> x{formatMultiplier(streak)}
          </span>
        )}
      </div>
      <span
        className="text-2xl leading-none font-black transition-shadow duration-500"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
};
