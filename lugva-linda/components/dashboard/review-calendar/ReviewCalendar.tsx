'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { format } from 'date-fns';
import {
  getReviewCalendarData,
  ReviewCalendarData,
} from '@/actions/review-actions';
import { SectionHeader } from '@/components/shared';
import { Card, CardContent } from '@/components/ui';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarBoard } from './CalendarBoard';
import { CalendarSkeleton } from './CalendarSkeleton';
import { DayDetailsPanel } from './DayDetailsPanel';

type ReviewCalendarProps = {
  initialData: ReviewCalendarData;
  activeLanguageId: string;
};

export const ReviewCalendar = ({
  initialData,
  activeLanguageId,
}: ReviewCalendarProps) => {
  const [currentData, setCurrentData] =
    useState<ReviewCalendarData>(initialData);
  const [isPending, startTransition] = useTransition();
  const isFirstMount = useRef(true);

  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());

  const {
    date,
    setDate,
    isMounted,
    completedDates,
    missedDates,
    plannedDates,
    todayWordCount,
    nextSession,
  } = useCalendarData(currentData);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth() + 1;

  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : undefined;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    startTransition(async () => {
      try {
        const newData = await getReviewCalendarData(
          activeLanguageId,
          year,
          month,
          selectedDateStr,
        );
        setCurrentData(newData);
      } catch (error) {
        console.error('Erreur lors du chargement des données du mois :', error);
      }
    });
  }, [activeLanguageId, year, month, selectedDateStr]);

  if (!isMounted) return <CalendarSkeleton />;

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="Planning des révisions" />

      <Card className="relative w-full gap-0 overflow-hidden p-0 shadow-md">
        {isPending && (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <span className="text-muted-foreground animate-pulse text-sm font-medium">
              Chargement...
            </span>
          </div>
        )}

        <CardContent className="flex flex-col p-0 sm:flex-row">
          <CalendarBoard
            date={date}
            setDate={setDate}
            plannedDates={plannedDates}
            missedDates={missedDates}
            completedDates={completedDates}
            displayMonth={displayMonth}
            setDisplayMonth={setDisplayMonth}
          />

          <DayDetailsPanel
            date={date}
            data={currentData}
            activeLanguageId={activeLanguageId}
            todayWordCount={todayWordCount}
            nextSession={nextSession}
          />
        </CardContent>
      </Card>
    </section>
  );
};
