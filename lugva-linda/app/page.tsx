import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/data/dashboard';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { isDatabaseUnavailableError } from '@/lib/errors';

import { Button } from '@/components/ui';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { LearningActions } from '@/components/dashboard/LearningActions';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/layout/header/Header';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { StateMessage } from '@/components/shared';

type HomePageProps = {
  searchParams: Promise<{ lang?: string }>;
};

type HomePageViewModel =
  | {
      status: 'ready';
      languages: Array<{ id: string; name: string }>;
      activeLanguageId: string;
      totalWords: number;
      wordsToReview: number;
    }
  | {
      status: 'database-unavailable';
    };

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const lang = searchParams.lang;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  let viewModel: HomePageViewModel;

  try {
    const { languages, activeLanguageId } = await resolveActiveLanguageForUser(
      { id: user.id, email: user.email },
      lang,
    );

    if (languages.length === 0) {
      redirect('/setup');
    }

    if (lang !== activeLanguageId) {
      redirect(`/?lang=${activeLanguageId}`);
    }

    const { totalWords, wordsToReview } = await getDashboardData(
      {
        id: user.id,
        email: user.email,
      },
      activeLanguageId,
    );

    viewModel = {
      status: 'ready',
      languages: languages.map((language) => ({
        id: language.id,
        name: language.name,
      })),
      activeLanguageId,
      totalWords,
      wordsToReview,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    viewModel = {
      status: 'database-unavailable',
    };
  }

  if (viewModel.status === 'database-unavailable') {
    return (
      <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header />

        <main className="space-y-6 px-4 pt-4">
          <StateMessage
            tone="error"
            title="Connexion temporairement indisponible"
            message="La base de donnees ne repond pas pour le moment. Verifiez votre connexion reseau ou reessayez dans quelques secondes."
          />

          <Button className="h-12" asChild>
            <Link href="/">Réessayer</Link>
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <ActiveLanguageProvider
      languages={viewModel.languages}
      activeLanguageId={viewModel.activeLanguageId}
    >
      <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header />

        <main className="space-y-8 px-4 pt-4">
          <DashboardStats
            totalWords={viewModel.totalWords}
            wordsToReview={viewModel.wordsToReview}
          />
          <LearningActions languageId={viewModel.activeLanguageId} />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
