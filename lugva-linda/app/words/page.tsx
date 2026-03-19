import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { Header } from '@/components/header/Header';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';

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

  if (!lang) {
    const firstLang = await prisma.userLanguage.findFirst({
      where: { userId: user.id },
      include: { language: true },
      orderBy: { createdAt: 'asc' },
    });
    if (firstLang) redirect(`/words?lang=${firstLang.language.id}`);
    else redirect('/setup');
  }

  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId: user.id },
    include: { language: true },
    orderBy: { createdAt: 'asc' },
  });

  const languages = userLanguages.map((item) => item.language);

  const words = await prisma.word.findMany({
    where: {
      ownerId: user.id,
      languageId: lang,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    orderBy: {
      term: 'asc',
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <Header languages={languages} title="Encyclopédie" />

      <main className="pt-4">
        <EncyclopediaClient words={words} />
      </main>

      <BottomNav />
    </div>
  );
}
