import { createClient } from '@/lib/supabase/server'
import type { Language } from '@prisma/client'

export async function getDashboardData(userId: string) {
  const supabase = await createClient()

  // Récupération des langues
  const { data: rawLanguages, error: langError } = await supabase
    .from('Language')
    .select('id, name, code')
    .eq('userId', userId)

  // Comptage des mots
  const { count: totalWords, error: wordError } = await supabase
    .from('Word')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)

  if (langError)
    console.error('Erreur de récupération des langues :', langError)
  if (wordError) console.error('Erreur de comptage des mots :', wordError)

  return {
    languages: (rawLanguages as Language[]) || [],
    totalWords: totalWords ?? 0,
    wordsToReview: 0, // Valeur statique pour l'instant
  }
}
