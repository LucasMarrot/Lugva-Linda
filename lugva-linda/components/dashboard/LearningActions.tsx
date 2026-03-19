import { DueTodayReviewButton } from '@/components/dashboard/DueTodayReviewButton';
import { ReviewBatchButton } from '@/components/dashboard/ReviewBatchButton';
import { SectionHeader } from '@/components/shared/SectionHeader';

type LearningActionsProps = {
  languageId: string;
};

export const LearningActions = ({ languageId }: LearningActionsProps) => {
  const reviewBatches = [10, 20, 30];

  return (
    <section>
      <div className="mb-3">
        <DueTodayReviewButton languageId={languageId} />
      </div>

      <SectionHeader title="Sessions forcees" className="mb-2" />

      <div className="grid grid-cols-3 gap-2">
        {reviewBatches.map((count) => (
          <ReviewBatchButton
            key={count}
            count={count}
            languageId={languageId}
          />
        ))}
      </div>
    </section>
  );
};
