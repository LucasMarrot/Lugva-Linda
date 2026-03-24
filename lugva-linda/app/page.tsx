import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/data/dashboard';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';

import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { LearningActions } from '@/components/dashboard/LearningActions';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/header/Header';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';

type HomePageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const lang = searchParams.lang;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

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

  return (
    <ActiveLanguageProvider
      languages={languages.map((language) => ({
        id: language.id,
        name: language.name,
      }))}
      activeLanguageId={activeLanguageId}
    >
      <div className="bg-background min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header title="Dashboard" />

        <main className="space-y-8 px-4 pt-4">
          <DashboardStats
            totalWords={totalWords}
            wordsToReview={wordsToReview}
          />
          <LearningActions languageId={activeLanguageId} />

          <Button
            variant="outline"
            className="bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground h-14 w-full justify-center gap-3 font-medium shadow-sm"
            asChild
          >
            <Link href="/words">
              <BookOpen className="text-primary h-5 w-5" />
              Parcourir l&apos;encyclopedie
            </Link>
          </Button>
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
