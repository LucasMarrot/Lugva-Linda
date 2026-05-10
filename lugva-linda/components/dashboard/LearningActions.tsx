import { ReviewBatchButton } from '@/components/dashboard/ReviewBatchButton';
import { SectionHeader } from '@/components/shared/';
import { REVIEW_BATCH_SIZES } from '@/lib/validation/schemas';

type LearningActionsProps = {
  languageId: string;
};

export const LearningActions = ({ languageId }: LearningActionsProps) => {
  return (
    <section>
      <SectionHeader title="Entraînement libre" className="mb-2" />

      <div className="flex flex-wrap items-center gap-3">
        {REVIEW_BATCH_SIZES.map((count) => (
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
