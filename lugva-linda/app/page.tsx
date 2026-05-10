import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/data/dashboard';
import { isDatabaseUnavailableError } from '@/lib/errors';
import { getCurrentUserProfile } from '@/lib/auth/server';

import { Button } from '@/components/ui';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { LearningActions } from '@/components/dashboard/LearningActions';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { StateMessage } from '@/components/shared';
import { ReviewCalendar } from '@/components/dashboard/ReviewCalendar';
import { Header } from '@/components/layout/header/Header';
import { getReviewCalendarData } from '@/actions/review-actions';

export default async function HomePage() {
  const user = await getCurrentUserProfile();

  if (!user) redirect('/auth/login');

  if (user.learningLanguages.length === 0) redirect('/setup');

  const activeLanguageId =
    user.activeLanguageId || user.learningLanguages[0].language.id;

  let dashboardData;
  let calendarData;
  let isDbDown = false;

  try {
    [dashboardData, calendarData] = await Promise.all([
      getDashboardData({ id: user.id, email: user.email }, activeLanguageId),
      getReviewCalendarData(activeLanguageId, 35),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    isDbDown = true;
  }

  if (isDbDown) {
    return (
      <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header />

        <main className="space-y-6 px-4 pt-4">
          <StateMessage
            tone="error"
            title="Connexion temporairement indisponible"
            message="La base de données ne répond pas pour le moment. Vérifiez votre connexion réseau ou réessayez dans quelques secondes."
          />

          <Button className="h-12 w-full" asChild>
            <Link href="/">Réessayer</Link>
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
      <Header />

      <main className="space-y-8 px-4 pt-4">
        <DashboardStats
          totalWords={dashboardData!.totalWords}
          wordsToReview={dashboardData!.wordsToReview}
        />

        <div className="flex flex-col items-start gap-10 md:flex-row">
          <div className="w-full max-w-4xl">
            <ReviewCalendar
              data={calendarData!}
              activeLanguageId={activeLanguageId}
            />
          </div>

          <LearningActions languageId={activeLanguageId} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
