'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge, Card, CardContent } from '@/components/ui';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PenTool, Brain, AudioLines } from 'lucide-react';
import { frenchPluralize } from '@/lib/utils';
import { DueTodayReviewButton } from './DueTodayReviewButton';
import { SectionHeader } from '../shared';
import { ReviewCalendarData } from '@/actions/review-actions';

type ReviewCalendarProps = {
  data: ReviewCalendarData;
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
    () => Object.keys(data.completed).map((d) => parseISO(d)),
    [data.completed],
  );

  const missedDates = React.useMemo<Date[]>(
    () =>
      data.missedDates
        .filter((d) => !data.completed[d])
        .map((d) => parseISO(d)),
    [data.missedDates, data.completed],
  );

  const plannedDates = React.useMemo<Date[]>(
    () =>
      Object.keys(data.planned)
        .filter((d) => !data.completed[d] && !data.missedDates.includes(d))
        .map((d) => parseISO(d)),
    [data.planned, data.completed, data.missedDates],
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWordCount = data.planned[todayStr]?.total || 0;

  const nextSession = React.useMemo(() => {
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
                "bg-emerald-700/10 border border-emerald-700/30 overflow-visible relative after:absolute after:-top-[5px] after:-right-[5px] after:flex after:border-1 after:border-background after:items-center after:justify-center after:h-4.5 after:w-4.5 after:rounded-full after:bg-emerald-700 after:text-white after:content-['✓'] after:text-sm after:font-bold after:shadow-sm",

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
                (() => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const statsCompleted = data.completed[dateKey];
                  const statsPlanned = data.planned[dateKey];
                  const isMissed =
                    data.missedDates.includes(dateKey) && !statsCompleted;

                  return (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold whitespace-nowrap capitalize">
                          {format(date, 'EEEE d MMMM', { locale: fr })}
                        </p>
                        <div className="flex flex-wrap justify-end gap-1">
                          {statsPlanned &&
                            !isMissed &&
                            statsPlanned.total > 0 && (
                              <Badge variant="primaryOutline">
                                {`${statsPlanned.total} ${frenchPluralize(statsPlanned.total, 'mot')} à
                                réviser`}
                              </Badge>
                            )}
                          {statsCompleted && (
                            <Badge variant="validOutline">
                              {`${statsCompleted.total} ${frenchPluralize(statsCompleted.total, 'mot')} ${frenchPluralize(statsCompleted.total, 'révisé')}`}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        {isMissed ? (
                          <p className="text-destructive text-xs">
                            Vous avez manqué votre révision pour ce jour.
                          </p>
                        ) : (
                          <>
                            {statsPlanned && statsPlanned.total > 0 && (
                              <div className="space-y-3">
                                <p className="text-foreground text-xs">
                                  Programme à réviser :
                                </p>
                                <CategoryGrid stats={statsPlanned} />
                              </div>
                            )}

                            {statsCompleted && (
                              <div className="space-y-3">
                                <p className="text-xs font-medium text-emerald-700">
                                  Programme révisé avec succès :
                                </p>
                                <CategoryGrid stats={statsCompleted} />
                              </div>
                            )}

                            {!statsPlanned && !statsCompleted && (
                              <p className="text-muted-foreground text-sm italic">
                                Aucune révision prévue pour ce jour.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()
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

function CategoryGrid({
  stats,
}: {
  stats: {
    READING: number;
    WRITING: number;
    PRONUNCIATION: number;
    total: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <StatItem
        label="Mémorisation"
        icon={<Brain className="h-3 w-3" />}
        value={stats.READING}
      />
      <StatItem
        label="Écriture"
        icon={<PenTool className="h-3 w-3" />}
        value={stats.WRITING}
      />
      <StatItem
        label="Prononciation"
        icon={<AudioLines className="h-3 w-3" />}
        value={stats.PRONUNCIATION}
      />
    </div>
  );
}

function StatItem({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
}) {
  if (value === 0) return null;
  return (
    <div className="bg-background flex items-center justify-between rounded-md border p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-primary-foreground bg-primary flex h-5 w-5 items-center justify-center rounded">
          {icon}
        </div>
        <span className="text-foreground/80 text-xs font-medium">{label}</span>
      </div>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}
