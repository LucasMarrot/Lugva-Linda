import { Brain, BookOpen } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { StateMessage } from '@/components/shared/StateMessage';

type DashboardStatsProps = {
  totalWords: number;
  wordsToReview: number;
};

export const DashboardStats = ({
  totalWords,
  wordsToReview,
}: DashboardStatsProps) => {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="À réviser"
          value={wordsToReview}
          icon={Brain}
          variant="primary"
        />
        <StatCard
          title="Total mots"
          value={totalWords}
          icon={BookOpen}
          variant="default"
        />
      </div>

      {totalWords === 0 && (
        <StateMessage
          tone="neutral"
          title="Encyclopedie vide"
          message="Ajoutez vos premiers mots pour lancer vos prochaines revisions."
        />
      )}
    </section>
  );
};
