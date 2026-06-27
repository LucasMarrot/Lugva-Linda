import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { EncyclopediaClient } from '@/components/encyclopedia/EncyclopediaClient';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';

import { ContributorConfigError } from '@/components/contributor/ContributorConfigError';
import { ContributorHeader } from '@/components/contributor/ContributorHeader';
import { BottomNavSearchLink } from '@/components/layout/bottom-nav/BottomNavSearchLink';

export default async function ContributePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) redirect('/auth/login');
  if (profile.role !== 'CONTRIBUTOR') redirect('/');

  if (!profile.targetOwnerId || !profile.activeLanguageId)
    return <ContributorConfigError />;

  const [language, targetOwner] = await Promise.all([
    prisma.language.findUnique({ where: { id: profile.activeLanguageId } }),
    prisma.user.findUnique({
      where: { id: profile.targetOwnerId },
      select: { username: true, email: true },
    }),
  ]);

  if (!language || !targetOwner) return <ContributorConfigError />;

  const words = await prisma.word.findMany({
    where: {
      ownerId: profile.targetOwnerId,
      languageId: profile.activeLanguageId,
      isDeleted: false,
      deleteToken: BigInt(0),
    },
    orderBy: { term: 'asc' },
  });

  const displayOwnerName =
    targetOwner.username || targetOwner.email.split('@')[0];

  return (
    <ActiveLanguageProvider
      languages={[{ id: language.id, name: language.name }]}
      activeLanguageId={language.id}
    >
      <div className="bg-background relative min-h-dvh pb-24">
        <ContributorHeader
          languageName={language.name}
          targetOwnerName={displayOwnerName}
        />

        <main className="pt-4">
          <EncyclopediaClient words={words} />
        </main>
      </div>

      <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-10 h-24">
        <div className="pointer-events-auto">
          <BottomNavSearchLink href="/contribute/search" fullWidth={true} />
        </div>
      </div>
    </ActiveLanguageProvider>
  );
}
