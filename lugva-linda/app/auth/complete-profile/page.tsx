import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { CompleteProfileForm } from './CompleteProfileForm';

export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?error=Invitation_requise');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });

  if (dbUser?.username) {
    redirect('/');
  }

  const takenColors = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: { colorHex: true },
  });

  const unavailableColors = takenColors.map((u) => u.colorHex as string);

  return <CompleteProfileForm unavailableColors={unavailableColors} />;
}
