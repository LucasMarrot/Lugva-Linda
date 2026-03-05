'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLanguage(formData: FormData) {
  // 1. Vérification de l'utilisateur Supabase
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autorisé')

  // 2. SYNCHRONISATION : On s'assure que le User existe dans Prisma
  await prisma.user.upsert({
    where: { id: user.id },
    update: {}, // S'il existe, on ne touche à rien
    create: {
      id: user.id,
      email: user.email ?? 'email@inconnu.com', // On récupère l'email validé par Supabase
    },
  })

  // 3. Récupération des données du formulaire
  const name = formData.get('name') as string
  const code = name.substring(0, 2).toUpperCase()

  // 4. Création de la langue (Maintenant, la contrainte de clé étrangère est respectée)
  await prisma.language.create({
    data: {
      name,
      code,
      userId: user.id,
    },
  })

  // 5. On demande à Next.js de recharger la page
  revalidatePath('/')
}
