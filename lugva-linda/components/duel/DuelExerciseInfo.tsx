'use client';

import { PenTool } from 'lucide-react';
import { Badge } from '@/components/ui';

export const DuelExerciseInfo = () => {
  return (
    <div className="m-0 flex flex-col items-center justify-center gap-2 px-4">
      <div className="bg-background flex flex-row items-center justify-between gap-3 p-2">
        <div className="text-primary-foreground bg-primary flex items-center justify-center rounded p-2">
          <PenTool className="h-5 w-5" />
        </div>
        <span className="text-primary text-xs font-bold tracking-wider uppercase">
          Écriture
        </span>
      </div>
      <Badge variant="secondary" className="text-sm">
        Écris la traduction de ce mot
      </Badge>
    </div>
  );
};
