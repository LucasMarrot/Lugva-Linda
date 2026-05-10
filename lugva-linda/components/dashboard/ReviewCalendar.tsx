'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge, Card, CardContent } from '@/components/ui';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { frenchPluralize } from '@/lib/utils';
import { DueTodayReviewButton } from './DueTodayReviewButton';
import { SectionHeader } from '../shared';

type ReviewCalendarProps = {
  data: {
    planned: Record<string, number>;
    missedDates: string[];
    completedDates: string[];
  };
  activeLanguageId: string;
};

export function ReviewCalendar({
  data,
  activeLanguageId,
}: ReviewCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    setDate(new Date());
  }, []);

  const completedDates = React.useMemo<Date[]>(
    () => data.completedDates.map((d) => parseISO(d)),
    [data.completedDates],
  );

  const missedDates = React.useMemo<Date[]>(
    () =>
      data.missedDates
        .filter((d) => !data.completedDates.includes(d))
        .map((d) => parseISO(d)),
    [data.missedDates, data.completedDates],
  );

  const plannedDates = React.useMemo<Date[]>(
    () =>
      Object.keys(data.planned)
        .filter(
          (d) =>
            !data.completedDates.includes(d) && !data.missedDates.includes(d),
        )
        .map((d) => parseISO(d)),
    [data.planned, data.completedDates, data.missedDates],
  );

  const selectedDateKey = date ? format(date, 'yyyy-MM-dd') : null;
  const wordCount = selectedDateKey ? data.planned[selectedDateKey] || 0 : 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWordCount = data.planned[todayStr] || 0;

  const nextSession = React.useMemo(() => {
    if (todayWordCount > 0) {
      return { date: new Date(), count: todayWordCount };
    }

    const futureDates = Object.keys(data.planned)
      .filter((dateKey) => dateKey > todayStr && data.planned[dateKey] > 0)
      .sort();

    if (futureDates.length > 0) {
      const nextDate = parseISO(futureDates[0]);
      return { date: nextDate, count: data.planned[futureDates[0]] };
    }

    return null;
  }, [data.planned, todayWordCount, todayStr]);

  if (!isMounted) {
    return (
      <section className="flex flex-col gap-2">
        <SectionHeader title="Planning des révisions" />
        <Card className="border-border w-full shadow-sm">
          <CardContent className="p-4">
            <div className="bg-muted/50 h-75 w-full animate-pulse rounded-md" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="Planning des révisions" />
      <Card className="w-full gap-0 p-0 shadow-md">
        <CardContent className="flex flex-col p-0 sm:flex-row">
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
                "bg-emerald-500/10 border border-emerald-500/30 overflow-visible relative after:absolute after:-top-[5px] after:-right-[5px] after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-4.5 after:w-4.5 after:rounded-full after:bg-emerald-500 after:text-white after:content-['✓'] after:text-sm after:font-bold after:shadow-sm",

              missed:
                "bg-destructive/10 border border-destructive/30 overflow-visible relative after:absolute after:-top-[5px] after:-right-[5px] after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-4.5 after:w-4.5 after:rounded-full after:bg-destructive after:text-white after:content-['✕'] after:text-sm after:shadow-sm after:text-sm after:font-bold",
            }}
            classNames={{
              root: 'w-full aspect-square',
              day: 'ml-0.5 mr-0.5 w-full aspect-square p-0 aria-selected:opacity-100 rounded-lg hover:bg-muted transition-colors duration-200',
            }}
          />

          <div className="border-border bg-muted/5 w-full border-t p-4 md:border-t-0 md:border-l">
            <div className="flex h-full flex-col justify-between gap-4">
              {date ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold capitalize">
                      {format(date, 'EEEE d MMMM', { locale: fr })}
                    </p>
                    {wordCount > 0 && (
                      <Badge variant="primaryOutline">
                        {wordCount} {frenchPluralize(wordCount, 'mot')} à
                        réviser
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {wordCount > 0
                      ? `Vous avez ${wordCount} ${frenchPluralize(wordCount, 'mot')} programmés.`
                      : 'Aucune révision prévue ou passée pour ce jour.'}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  Sélectionnez un jour pour voir les détails.
                </p>
              )}
              <DueTodayReviewButton
                languageId={activeLanguageId}
                todayWordCount={todayWordCount}
                nextSessionDate={nextSession?.date || null}
                nextSessionWordCount={nextSession?.count ?? 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
