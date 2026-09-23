import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/server';
import prisma from '@/lib/prisma';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { SearchRoutePage } from '@/components/search/SearchRoutePage';

type SearchPageProps = {
  searchParams: Promise<{ lang?: string; query?: string; from?: string }>;
};

const buildCanonicalSearchHref = (query?: string): string => {
  const params = new URLSearchParams();

  if (query) params.set('query', query);

  return `/search?${params.toString()}`;
};

const SearchPage = async (props: SearchPageProps) => {
  const searchParams = await props.searchParams;

  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');

  const languages = profile.learningLanguages.map((ll) => ll.language);
  if (languages.length === 0) redirect('/setup');

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

  if (!activeLanguageId) redirect('/setup');

  const validLanguageId = activeLanguageId as string;

  const contributors = await prisma.user.findMany({
    where: {
      targetOwnerId: profile.id,
      role: 'CONTRIBUTOR',
      activeLanguageId: validLanguageId,
    },
    select: { id: true, username: true, email: true },
  });

  if (searchParams.lang || searchParams.from)
    redirect(buildCanonicalSearchHref(searchParams.query));

  return (
    <ActiveLanguageProvider
      languages={languages.map((language) => ({
        id: language.id,
        name: language.name,
      }))}
      activeLanguageId={validLanguageId}
    >
      <SearchRoutePage
        initialQuery={searchParams.query ?? ''}
        currentLangId={validLanguageId}
        contributors={contributors.map((c) => ({
          id: c.id,
          name: c.username || c.email.split('@')[0],
        }))}
      />
    </ActiveLanguageProvider>
  );
};

export default SearchPage;
