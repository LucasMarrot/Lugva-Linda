import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { getDashboardData } from '@/data/dashboard';
import { getReviewCalendarData } from '@/actions/review-actions';

import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/layout/header/Header';
import { LearningActions } from '@/components/dashboard/LearningActions';
import { DashboardStatsSkeleton } from '@/components/dashboard/DashboardStatsSkeleton';
import { DashboardStatsStream } from '@/components/dashboard/DashboardStatsStream';
import { CalendarSkeleton } from '@/components/dashboard/review-calendar/CalendarSkeleton';
import { ReviewCalendarStream } from '@/components/dashboard/review-calendar/ReviewCalendarStream';

export default async function HomePage() {
  const user = await getCurrentUserProfile();

  if (!user) redirect('/auth/login');
  if (user.learningLanguages.length === 0) redirect('/setup');

  const activeLanguageId =
    user.activeLanguageId || user.learningLanguages[0].language.id;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const dashboardPromise = getDashboardData(
    { id: user.id, email: user.email },
    activeLanguageId,
  );
  const calendarPromise = getReviewCalendarData(
    activeLanguageId,
    currentYear,
    currentMonth,
  );

  return (
    <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
      <Header />

      <main className="space-y-8 px-4 pt-4">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsStream promise={dashboardPromise} />
        </Suspense>

        <div className="flex flex-col items-start gap-10 md:flex-row">
          <div className="w-full max-w-4xl">
            <Suspense fallback={<CalendarSkeleton />}>
              <ReviewCalendarStream
                promise={calendarPromise}
                activeLanguageId={activeLanguageId}
              />
            </Suspense>
          </div>

          <LearningActions languageId={activeLanguageId} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
