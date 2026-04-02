import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/header/Header';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';
import { createClient } from '@/lib/supabase/server';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { listMemberWordsInLanguage } from '@/lib/services/word-service';
import { toDisplayName } from '@/lib/words/community';
import prisma from '@/lib/prisma';

type MemberPageProps = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function MemberPage(props: MemberPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { languages, activeLanguageId } = await resolveActiveLanguageForUser(
    { id: user.id, email: user.email },
    searchParams.lang,
  );

  if (languages.length === 0 || !activeLanguageId) {
    redirect('/setup');
  }

  if (searchParams.lang !== activeLanguageId) {
    redirect(`/community/${params.memberId}?lang=${activeLanguageId}`);
  }

  const member = await prisma.user.findUnique({
    where: { id: params.memberId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!member) {
    notFound();
  }

  const words = await listMemberWordsInLanguage(
    user.id,
    member.id,
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
      <div className="bg-background min-h-dvh">
        <Header
          title={`Encyclopedie de ${toDisplayName(member.email, member.id)}`}
        />

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
