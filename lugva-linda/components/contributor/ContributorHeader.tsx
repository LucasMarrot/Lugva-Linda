import SettingsButton from '../layout/header/SettingsButton';

type ContributorHeaderProps = {
  languageName: string;
  targetOwnerName: string;
};

export const ContributorHeader = ({
  languageName,
  targetOwnerName,
}: ContributorHeaderProps) => {
  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-49 flex h-[calc(4rem+var(--safe-area-top))] w-full items-center justify-between border-b px-4 pt-(--safe-area-top) backdrop-blur">
      <div className="flex flex-col">
        <div className="z-10 flex items-center gap-2">
          <p className="text-xl font-bold tracking-tight">Lugva Linda</p>
        </div>
        <span className="text-muted-foreground text-xs font-medium">
          {languageName} • {targetOwnerName}
        </span>
      </div>
      <SettingsButton hideProfileEdit={true} />
    </header>
  );
};
