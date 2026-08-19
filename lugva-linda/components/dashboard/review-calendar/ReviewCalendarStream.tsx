import { use } from 'react';
import { ReviewCalendar } from '@/components/dashboard/review-calendar/ReviewCalendar';
import type { getReviewCalendarData } from '@/actions/review-actions';

type ReviewCalendarStreamProps = {
  promise: ReturnType<typeof getReviewCalendarData>;
  activeLanguageId: string;
};

export const ReviewCalendarStream = ({
  promise,
  activeLanguageId,
}: ReviewCalendarStreamProps) => {
  const data = use(promise);

  return (
    <ReviewCalendar
      initialData={data}
      activeLanguageId={activeLanguageId}
    />
  );
};
