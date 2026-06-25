import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/server';

export default async function ContributePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'CONTRIBUTOR') {
    redirect('/');
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-primary mb-4 text-4xl font-black tracking-widest">
        CONTRIBUTEUR
      </h1>
      <p className="text-muted-foreground">
        Votre espace de saisie rapide sera bientôt disponible.
      </p>
    </div>
  );
}
