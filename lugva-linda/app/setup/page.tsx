import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { createLanguage } from '@/actions/language-actions'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const languageCount = await prisma.language.count({
    where: { userId: user.id },
  })

  if (languageCount > 0) redirect('/')

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="border-border w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary text-2xl">Bienvenue !</CardTitle>
          <CardDescription>
            Pour commencer, veuillez configurer la première langue que vous
            souhaitez apprendre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLanguage} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="name"
                placeholder="Nom de la langue (ex: Anglais)"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Commencer l'apprentissage
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
