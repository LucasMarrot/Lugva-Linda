import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/server';
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

  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');

  const languages = profile.learningLanguages.map((ll) => ll.language);
  if (languages.length === 0) {
    redirect('/setup');
  }

  let activeLanguageId: string | null =
    lang && languages.some((l) => l.id === lang)
      ? lang
      : profile.activeLanguageId || languages[0]?.id || null;

  if (!activeLanguageId) {
    const resolved = await resolveActiveLanguageForUser(
      { id: profile.id, email: profile.email },
      lang,
    );
    activeLanguageId = resolved.activeLanguageId;
  }

  if (!activeLanguageId) {
    redirect('/setup');
  }

  const validLanguageId = activeLanguageId as string;

  const notifPreference = await prisma.notificationPreference.findUnique({
    where: { userId: profile.id },
  });

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
      activeLanguageId={validLanguageId}
    >
      <div className="bg-background min-h-dvh pb-[calc(var(--bottom-nav-height)+1rem)]">
        <Header />

        <main className="space-y-6 px-4 pt-4 pb-6">
          <SettingsClient
            profile={{
              id: profile.id,
              email: profile.email,
              username: profile.username,
              colorHex: profile.colorHex,
              role: profile.role,
            }}
            languages={languages.map((l) => ({ id: l.id, name: l.name }))}
            notifPrefs={notifPrefs}
          />
        </main>

        <BottomNav />
      </div>
    </ActiveLanguageProvider>
  );
}
