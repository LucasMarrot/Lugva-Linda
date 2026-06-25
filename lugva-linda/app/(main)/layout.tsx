import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  // Si c'est un contributeur, on l'éjecte de la zone (main)
  if (profile?.role === 'CONTRIBUTOR') {
    redirect('/contribute');
  }

  // Sinon, on affiche les pages normales
  return <>{children}</>;
}
