import { use } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import type { getDashboardData } from '@/data/dashboard';

type DashboardStatsStreamProps = {
  promise: ReturnType<typeof getDashboardData>;
};

export const DashboardStatsStream = ({ promise }: DashboardStatsStreamProps) => {
  const data = use(promise);

  return (
    <DashboardStats
      totalWords={data.totalWords}
      cardsToReview={data.cardsToReview}
    />
  );
};
