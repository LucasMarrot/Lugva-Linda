'use client';

import { Brain, PenTool, AudioLines } from 'lucide-react';

type CategoryStats = {
  READING: number;
  WRITING: number;
  PRONUNCIATION: number;
  total: number;
};

type StatItemProps = {
  label: string;
  icon: React.ReactNode;
  value: number;
};

const StatItem = ({ label, icon, value }: StatItemProps) => {
  if (value === 0) return null;
  return (
    <div className="bg-background flex items-center justify-between rounded-md border p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-primary-foreground bg-primary flex h-5 w-5 items-center justify-center rounded">
          {icon}
        </div>
        <span className="text-foreground/80 text-xs font-medium">{label}</span>
      </div>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
};

export const CategoryGrid = ({ stats }: { stats: CategoryStats }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      <StatItem
        label="Mémorisation"
        icon={<Brain className="h-3 w-3" />}
        value={stats.READING}
      />
      <StatItem
        label="Écriture"
        icon={<PenTool className="h-3 w-3" />}
        value={stats.WRITING}
      />
      <StatItem
        label="Prononciation"
        icon={<AudioLines className="h-3 w-3" />}
        value={stats.PRONUNCIATION}
      />
    </div>
  );
};
