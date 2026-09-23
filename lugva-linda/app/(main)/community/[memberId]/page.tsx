import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/layout/header/Header';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { listMemberWordsInLanguage } from '@/lib/services/word-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type MemberPageProps = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function MemberPage(props: MemberPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/auth/login');
  }

  const languages = profile.learningLanguages.map((ll) => ll.language);
  if (languages.length === 0) {
    redirect('/setup');
  }

  let activeLanguageId: string | null =
    searchParams.lang && languages.some((l) => l.id === searchParams.lang)
      ? searchParams.lang
      : profile.activeLanguageId || languages[0]?.id || null;

  if (!activeLanguageId) {
    const resolved = await resolveActiveLanguageForUser(
      { id: profile.id, email: profile.email },
      searchParams.lang,
    );
    activeLanguageId = resolved.activeLanguageId;
  }

  if (!activeLanguageId) {
    redirect('/setup');
  }

  const validLanguageId = activeLanguageId as string;

  const member = await prisma.user.findUnique({
    where: { id: params.memberId },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (!member) {
    notFound();
  }

  const words = await listMemberWordsInLanguage(
    profile.id,
    member.id,
    validLanguageId,
  );

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
          <EncyclopediaClient
            words={words}
            mode="external"
            emptyMessage="Cette encyclopedie est vide."
          />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
