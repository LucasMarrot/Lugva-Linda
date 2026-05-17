'use client';

import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';

type CalendarBoardProps = {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  plannedDates: Date[];
  missedDates: Date[];
  completedDates: Date[];
};

export const CalendarBoard = ({
  date,
  setDate,
  plannedDates,
  missedDates,
  completedDates,
}: CalendarBoardProps) => {
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={fr}
      modifiers={{
        planned: plannedDates,
        missed: missedDates,
        completed: completedDates,
      }}
      modifiersClassNames={{
        today: 'bg-primary/10 [&_button]:!font-semibold rounded-lg',
        planned:
          'border border-primary/30 overflow-visible relative after:absolute after:-top-1 after:-right-1 after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-3 after:w-3 after:rounded-full after:bg-primary after:shadow-sm',
        completed:
          "bg-emerald-700/10 border border-emerald-700/30 overflow-visible relative after:absolute after:-top-[5px] after:-right-[5px] after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-4.5 after:w-4.5 after:rounded-full after:bg-emerald-700 after:text-white after:content-['✓'] after:text-sm after:font-bold after:shadow-sm",
        missed:
          "bg-destructive/10 border border-destructive/30 overflow-visible relative after:absolute after:-top-[5px] after:-right-[5px] after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-4.5 after:w-4.5 after:rounded-full after:bg-destructive after:text-white after:content-['✕'] after:text-sm after:shadow-sm after:text-sm after:font-bold",
      }}
      classNames={{
        root: 'w-full aspect-square',
        day: 'ml-0.5 mr-0.5 w-full aspect-square p-0 aria-selected:opacity-100 rounded-lg hover:bg-muted transition-colors duration-200',
      }}
    />
  );
};
