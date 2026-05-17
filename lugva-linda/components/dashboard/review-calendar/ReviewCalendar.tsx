'use client';

import { ReviewCalendarData } from '@/actions/review-actions';
import { SectionHeader } from '@/components/shared';
import { Card, CardContent } from '@/components/ui';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarBoard } from './CalendarBoard';
import { CalendarSkeleton } from './CalendarSkeleton';
import { DayDetailsPanel } from './DayDetailsPanel';

type ReviewCalendarProps = {
  data: ReviewCalendarData;
  activeLanguageId: string;
};

export const ReviewCalendar = ({
  data,
  activeLanguageId,
}: ReviewCalendarProps) => {
  const {
    date,
    setDate,
    isMounted,
    completedDates,
    missedDates,
    plannedDates,
    todayWordCount,
    nextSession,
  } = useCalendarData(data);

  if (!isMounted) {
    return <CalendarSkeleton />;
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="Planning des révisions" />

      <Card className="w-full gap-0 p-0 shadow-md">
        <CardContent className="flex flex-col p-0 sm:flex-row">
          <CalendarBoard
            date={date}
            setDate={setDate}
            plannedDates={plannedDates}
            missedDates={missedDates}
            completedDates={completedDates}
          />

          <DayDetailsPanel
            date={date}
            data={data}
            activeLanguageId={activeLanguageId}
            todayWordCount={todayWordCount}
            nextSession={nextSession}
          />
        </CardContent>
      </Card>
    </section>
  );
};
