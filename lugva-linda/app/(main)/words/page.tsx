import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/layout/header/Header';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';

type WordsPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function WordsPage(props: WordsPageProps) {
  const searchParams = await props.searchParams;
  const lang = searchParams.lang;

  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');

  const languages = profile.learningLanguages.map((ll) => ll.language);
  if (languages.length === 0) {
    redirect('/setup');
  }

  let activeLanguageId: string | null =
    lang && languages.some((l) => l.id === lang)
      ? lang
      : profile.activeLanguageId || languages[0]?.id || null;

  if (!activeLanguageId) {
    const resolved = await resolveActiveLanguageForUser(
      { id: profile.id, email: profile.email },
      lang,
    );
    activeLanguageId = resolved.activeLanguageId;
  }

  if (!activeLanguageId) {
    redirect('/setup');
  }

  const validLanguageId = activeLanguageId;

  const words = await prisma.word.findMany({
    where: {
      ownerId: profile.id,
      languageId: validLanguageId,
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
      activeLanguageId={validLanguageId}
    >
      <div className="bg-background min-h-dvh">
        <Header />

        <main className="pt-4">
          <EncyclopediaClient words={words} />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
