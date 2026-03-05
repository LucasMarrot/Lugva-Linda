'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWord(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autorisé')

  const word = formData.get('word') as string
  const translation = formData.get('translation') as string
  let languageId = formData.get('languageId') as string

  const tags = formData.getAll('tags') as string[]
  const synonyms = formData.getAll('synonyms') as string[]

  const audioFile = formData.get('audioFile') as File | null
  let customAudioUrl: string | null = null

  if (audioFile && audioFile.size > 0) {
    const fileExtension = audioFile.name.split('.').pop() || 'webm'
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error("Erreur d'upload audio:", uploadError)
      throw new Error("Impossible de sauvegarder l'audio")
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('audio-files').getPublicUrl(fileName)

    customAudioUrl = publicUrl
  }

  if (!languageId) {
    const firstLang = await prisma.language.findFirst({
      where: { userId: user.id },
    })
    if (!firstLang) throw new Error('Aucune langue trouvée')
    languageId = firstLang.id
  }

  await prisma.word.create({
    data: {
      word,
      translation,
      tags,
      synonyms,
      customAudio: customAudioUrl,
      languageId,
      userId: user.id,
    },
  })

  revalidatePath('/')
}

export async function searchWords(query: string, languageId: string) {
  if (!query) return []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const normalizedQuery = query.normalize('NFC').trim()

  let activeLangId = languageId
  if (!activeLangId) {
    const firstLang = await prisma.language.findFirst({
      where: { userId: user.id },
    })
    if (!firstLang) return []
    activeLangId = firstLang.id
  }

  const words = await prisma.word.findMany({
    where: {
      userId: user.id,
      languageId: activeLangId,
      OR: [
        { word: { contains: normalizedQuery, mode: 'insensitive' } },
        { translation: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: {
      word: 'asc',
    },
  })

  return words
}
