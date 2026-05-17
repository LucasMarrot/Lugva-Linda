'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui';
import { frenchPluralize } from '@/lib/utils';
import { CategoryGrid } from './CategoryGrid';
import { DueTodayReviewButton } from '../DueTodayReviewButton';
import { ReviewCalendarData } from '@/actions/review-actions';

type DayDetailsPanelProps = {
  date: Date | undefined;
  data: ReviewCalendarData;
  activeLanguageId: string;
  todayWordCount: number;
  nextSession: { date: Date; count: number } | null;
};

export const DayDetailsPanel = ({
  date,
  data,
  activeLanguageId,
  todayWordCount,
  nextSession,
}: DayDetailsPanelProps) => {
  return (
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
                    {statsPlanned && !isMissed && statsPlanned.total > 0 && (
                      <Badge variant="primaryOutline">
                        {`${statsPlanned.total} ${frenchPluralize(statsPlanned.total, 'mot')} à réviser`}
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
  );
};
