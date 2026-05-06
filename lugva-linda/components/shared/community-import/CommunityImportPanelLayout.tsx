'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Tag } from 'lucide-react';
import { SectionHeader } from '@/components/shared';

type PanelHeaderProps = {
  label: string;
  term: string;
  mandatoryTag: string;
};

type PanelShellProps = {
  header: ReactNode;
  children: ReactNode;
};

type PanelSectionProps = {
  title: string;
  children: ReactNode;
};

type TagListProps = {
  children: ReactNode;
};

export const panelCardClasses = 'rounded-xl border bg-muted/20 p-3';

export const handleCardKeyToggle = (
  event: KeyboardEvent<HTMLElement>,
  onToggle: () => void,
  disabled = false,
) => {
  if (disabled) {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onToggle();
  }
};

export const CommunityImportPanelHeader = ({
  label,
  term,
  mandatoryTag,
}: PanelHeaderProps) => (
  <div className="border-border/70 bg-muted flex w-full shrink-0 flex-row items-center justify-between border-b px-4 py-2 sm:px-5">
    <p className="text-muted-foreground text-xs font-semibold uppercase">
      {label}
    </p>
    <div className="flex flex-row items-center gap-4">
      <h2 className="text-xl font-extrabold">{term}</h2>

      {mandatoryTag && (
        <div className="bg-muted/20 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
          <Tag className="text-foreground h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">{mandatoryTag}</span>
        </div>
      )}
    </div>
  </div>
);

export const CommunityImportPanelShell = ({
  header,
  children,
}: PanelShellProps) => (
  <section className="bg-card order-b-8 flex min-h-0 flex-col">
    {header}
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
      {children}
    </div>
  </section>
);

export const CommunityImportPanelSection = ({
  title,
  children,
}: PanelSectionProps) => (
  <div className="space-y-3">
    <SectionHeader title={title} />
    {children}
  </div>
);

export const CommunityImportTagList = ({ children }: TagListProps) => (
  <div className="flex flex-wrap gap-2">{children}</div>
);
