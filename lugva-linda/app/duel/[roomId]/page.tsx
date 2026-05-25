import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DuelRoomClient } from './DuelRoomClient';
import { getCurrentUserProfile } from '@/lib/auth/server';
import prisma from '@/lib/prisma';

type DuelPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function DuelPage({
  params,
  searchParams,
}: DuelPageProps) {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const languageId = resolvedSearchParams.lang;

  if (!languageId) redirect('/');

  const language = await prisma.language.findUnique({
    where: { id: languageId },
    select: { name: true },
  });

  if (!language) redirect('/');

  const challengerId = resolvedParams.roomId.split('_')[1];

  return (
    <main>
      <DuelRoomClient
        roomId={resolvedParams.roomId}
        currentUserId={user.id}
        challengerId={challengerId}
        languageId={languageId}
        currentUserName={profile?.username || 'Joueur'}
        currentUserColor={profile?.colorHex || '#3B82F6'}
        languageName={language.name}
      />
    </main>
  );
}
