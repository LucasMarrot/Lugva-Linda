import { Brain, BookOpen } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'

type DashboardStatsProps = {
  totalWords: number
  wordsToReview: number
}

export const DashboardStats = ({
  totalWords,
  wordsToReview,
}: DashboardStatsProps) => {
  return (
    <section className="grid grid-cols-2 gap-3">
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
    </section>
  )
}
