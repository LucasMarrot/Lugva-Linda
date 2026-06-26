import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { SearchRoutePage } from '@/components/search/SearchRoutePage';
import { ContributorConfigError } from '@/components/contributor/ContributorConfigError';

type ContributorSearchPageProps = {
  searchParams: Promise<{ query?: string }>;
};

export default async function ContributorSearchPage(
  props: ContributorSearchPageProps,
) {
  const searchParams = await props.searchParams;
  const profile = await getCurrentUserProfile();

  if (!profile) redirect('/auth/login');
  if (profile.role !== 'CONTRIBUTOR') redirect('/');

  if (!profile.targetOwnerId || !profile.activeLanguageId)
    return <ContributorConfigError />;

  const language = await prisma.language.findUnique({
    where: { id: profile.activeLanguageId },
  });

  if (!language) return <ContributorConfigError />;

  return (
    <ActiveLanguageProvider
      languages={[{ id: language.id, name: language.name }]}
      activeLanguageId={language.id}
    >
      <SearchRoutePage
        initialQuery={searchParams.query ?? ''}
        currentLangId={language.id}
        isContributorMode={true}
      />
    </ActiveLanguageProvider>
  );
}
