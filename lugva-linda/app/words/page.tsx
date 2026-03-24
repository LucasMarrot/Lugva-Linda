import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/header/Header';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';

type WordsPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function WordsPage(props: WordsPageProps) {
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

  if (languages.length === 0 || !activeLanguageId) {
    redirect('/setup');
  }

  if (lang !== activeLanguageId) {
    redirect(`/words?lang=${activeLanguageId}`);
  }

  const words = await prisma.word.findMany({
    where: {
      ownerId: user.id,
      languageId: activeLanguageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    orderBy: {
      term: 'asc',
    },
  });

  return (
    <ActiveLanguageProvider
      languages={languages.map((language) => ({
        id: language.id,
        name: language.name,
      }))}
      activeLanguageId={activeLanguageId}
    >
      <div className="bg-background min-h-screen">
        <Header title="Encyclopédie" />

        <main className="pt-4">
          <EncyclopediaClient words={words} />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
