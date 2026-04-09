import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { languages, activeLanguageId } = await resolveActiveLanguageForUser(
    { id: user.id, email: user.email },
    searchParams.lang,
  );

  if (languages.length === 0 || !activeLanguageId) redirect('/setup');

  if (searchParams.lang || searchParams.from)
    redirect(buildCanonicalSearchHref(searchParams.query));

  return (
    <ActiveLanguageProvider
      languages={languages.map((language) => ({
        id: language.id,
        name: language.name,
      }))}
      activeLanguageId={activeLanguageId}
    >
      <SearchRoutePage
        initialQuery={searchParams.query ?? ''}
        currentLangId={activeLanguageId}
      />
    </ActiveLanguageProvider>
  );
};

export default SearchPage;
