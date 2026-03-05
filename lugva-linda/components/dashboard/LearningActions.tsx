import { ReviewBatchButton } from '@/components/dashboard/ReviewBatchButton'

export const LearningActions = () => {
  const reviewBatches = [10, 20, 30]

  return (
    <section>
      <div className="grid grid-cols-3 gap-2">
        {reviewBatches.map((count) => (
          <ReviewBatchButton key={count} count={count} />
        ))}
      </div>
    </section>
  )
}
