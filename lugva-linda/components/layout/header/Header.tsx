import { LanguageSelector } from './LanguageSelector';
import { MembersPopoverButton } from './MembersPopoverButton';
import SettingsButton from './SettingsButton';
import { TypoLogo } from '@/components/shared';
import { getCurrentUserProfile } from '@/lib/auth/server';
import prisma from '@/lib/prisma';

export const Header = async () => {
  const profile = await getCurrentUserProfile();

  let initialWordAssignedEnabled = true;
  if (profile?.role === 'CONTRIBUTOR') {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: profile.id },
      select: { wordAssignedEnabled: true },
    });
    initialWordAssignedEnabled = prefs?.wordAssignedEnabled ?? true;
  }

  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-49 flex h-[calc(4rem+var(--safe-area-top))] w-full items-center justify-between border-b px-4 pt-(--safe-area-top) backdrop-blur">
      <div className="z-10 flex items-center gap-2">
        <TypoLogo className="h-5 w-auto text-foreground" />
      </div>

      <div className="z-10 flex items-center gap-2">
        <LanguageSelector />
        <MembersPopoverButton />
        <SettingsButton initialWordAssignedEnabled={initialWordAssignedEnabled} />
      </div>
    </header>
  );
};
