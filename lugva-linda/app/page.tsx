import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/data/dashboard'

import { Button } from '@/components/ui/button'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { LearningActions } from '@/components/dashboard/LearningActions'
import { BottomNav } from '@/components/layout/bottom-nav/BottomNav'
import { Header } from '@/components/header/Header'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { languages, totalWords, wordsToReview } = await getDashboardData(
    user.id,
  )

  return (
    <div className="bg-background min-h-screen pb-24">
      <Header languages={languages} />

      <main className="space-y-8 px-4 pt-4">
        <DashboardStats totalWords={totalWords} wordsToReview={wordsToReview} />
        <LearningActions />

        <Button
          variant="outline"
          className="bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground h-14 w-full justify-center gap-3 font-medium shadow-sm"
          asChild
        >
          <Link href="/words">
            <BookOpen className="text-primary h-5 w-5" />
            Parcourir l'encyclopédie
          </Link>
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
