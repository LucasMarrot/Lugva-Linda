import { useState, useMemo, useSyncExternalStore } from 'react';
import { format, parseISO } from 'date-fns';
import { ReviewCalendarData } from '@/actions/review-actions';

const emptySubscribe = () => () => {};

export const useCalendarData = (data: ReviewCalendarData) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [date, setDate] = useState<Date | undefined>(() => new Date());

  const completedDates = useMemo<Date[]>(
    () => Object.keys(data.completed).map((d) => parseISO(d)),
    [data.completed],
  );

  const missedDates = useMemo<Date[]>(
    () =>
      data.missedDates
        .filter((d) => !data.completed[d])
        .map((d) => parseISO(d)),
    [data.missedDates, data.completed],
  );

  const plannedDates = useMemo<Date[]>(
    () =>
      Object.keys(data.planned)
        .filter((d) => !data.completed[d] && !data.missedDates.includes(d))
        .map((d) => parseISO(d)),
    [data.planned, data.completed, data.missedDates],
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWordCount = data.planned[todayStr]?.total || 0;

  const nextSession = useMemo(() => {
    if (todayWordCount > 0) {
      return { date: new Date(), count: todayWordCount };
    }

    const futureDates = Object.keys(data.planned)
      .filter(
        (dateKey) => dateKey > todayStr && data.planned[dateKey].total > 0,
      )
      .sort();

    if (futureDates.length > 0) {
      const nextDate = parseISO(futureDates[0]);
      return { date: nextDate, count: data.planned[futureDates[0]].total };
    }

    return null;
  }, [data.planned, todayWordCount, todayStr]);

  return {
    date,
    setDate,
    isMounted,
    completedDates,
    missedDates,
    plannedDates,
    todayWordCount,
    nextSession,
  };
};
