import { LanguageSelector } from './LanguageSelector';
import { MembersPopoverButton } from './MembersPopoverButton';
import SettingsButton from './SettingsButton';

export const Header = () => {
  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-49 flex h-[calc(4rem+var(--safe-area-top))] w-full items-center justify-between border-b px-4 pt-(--safe-area-top) backdrop-blur">
      <div className="z-10 flex items-center gap-2">
        <p className="text-xl font-bold tracking-tight">Lugva Linda</p>
      </div>

      <div className="z-10 flex items-center gap-2">
        <LanguageSelector />
        <MembersPopoverButton />
        <SettingsButton />
      </div>
    </header>
  );
};
