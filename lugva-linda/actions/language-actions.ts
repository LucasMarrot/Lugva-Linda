'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLanguage(formData: FormData) {
  // 1. Vérification de l'utilisateur
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autorisé')

  // 2. Récupération des données du formulaire
  const name = formData.get('name') as string
  const code = formData.get('code') as string

  // 3. Création dans la base de données
  await prisma.language.create({
    data: {
      name,
      code,
      userId: user.id,
    },
  })

  // 4. On demande à Next.js de recharger la page pour afficher la nouvelle langue
  revalidatePath('/')
}
