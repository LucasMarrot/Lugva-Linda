import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import prisma from '@/lib/prisma';
import { Header } from '@/components/layout/header/Header';
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';
import { SettingsClient } from '@/components/settings/SettingsClient';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications';

type SettingsPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function SettingsPage(props: SettingsPageProps) {
  const searchParams = await props.searchParams;
  const lang = searchParams.lang;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { languages, activeLanguageId } = await resolveActiveLanguageForUser(
    { id: user.id, email: user.email },
    lang,
  );

  if (languages.length === 0 || !activeLanguageId) {
    redirect('/setup');
  }

  if (lang !== activeLanguageId) {
    redirect(`/settings?lang=${activeLanguageId}`);
  }

  const [profile, notifPreference] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        colorHex: true,
        role: true,
      },
    }),
    prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    }),
  ]);

  if (!profile) {
    redirect('/auth/login');
  }

  const notifPrefs = notifPreference
    ? {
        sessionReminderEnabled: notifPreference.sessionReminderEnabled,
        sessionReminderLanguages: notifPreference.sessionReminderLanguages,
        wordCompletedEnabled: notifPreference.wordCompletedEnabled,
        wordAssignedEnabled: notifPreference.wordAssignedEnabled,
      }
    : { ...DEFAULT_NOTIFICATION_PREFERENCES };

  return (
    <ActiveLanguageProvider
      languages={languages.map((language) => ({
        id: language.id,
        name: language.name,
      }))}
      activeLanguageId={activeLanguageId}
    >
      <div className="bg-background min-h-dvh pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header />

        <main className="space-y-6 px-4 pt-4 pb-6">
          <SettingsClient
            profile={profile}
            languages={languages.map((l) => ({ id: l.id, name: l.name }))}
            notifPrefs={notifPrefs}
          />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
