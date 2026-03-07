'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createWord, updateWordAction } from '@/actions/word-actions'
import { SynonymSelector } from './SynonymSelector'
import { AudioRecorder } from './AudioRecorder'
import { TagSelector } from './TagSelector'
import { Word } from '@prisma/client'

type CreateWordViewProps = {
  initialQuery?: string
  currentLangId?: string
  initialData?: Word
  onCancel: () => void
  onSuccess: () => void
}

export const CreateWordView = ({
  initialQuery = '',
  currentLangId = '',
  initialData,
  onCancel,
  onSuccess,
}: CreateWordViewProps) => {
  const isEditing = !!initialData

  const [selectedTag, setSelectedTag] = useState<string | null>(
    initialData?.tags?.[0] || null,
  )
  const [selectedSynonyms, setSelectedSynonyms] = useState<string[]>(
    initialData?.synonyms || [],
  )
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const langId = isEditing ? initialData.languageId : currentLangId
  const defaultWord = isEditing ? initialData.word : initialQuery

  const handleSubmit = async (formData: FormData) => {
    if (audioFile) {
      formData.append('audioFile', audioFile)
    }

    if (isEditing) {
      await updateWordAction(initialData.id, formData)
    } else {
      await createWord(formData)
    }

    onSuccess()
  }

  return (
    <div className="animate-in slide-in-from-right-4 fade-in space-y-6 pb-8 duration-200">
      <div className="mb-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="-ml-2"
        >
          <ArrowLeft className="text-foreground h-5 w-5" />
        </Button>
        <h3 className="text-foreground text-lg font-semibold">
          {isEditing ? 'Modifier la fiche' : "Ajouter à l'encyclopédie"}
        </h3>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="languageId" value={langId} />
        {selectedTag && <input type="hidden" name="tags" value={selectedTag} />}
        {selectedSynonyms.map((syn) => (
          <input key={syn} type="hidden" name="synonyms" value={syn} />
        ))}

        <div className="bg-muted/30 border-border/50 space-y-4 rounded-xl border p-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-foreground font-medium">
              Mot ou expression
            </Label>
            <Input
              id="word"
              name="word"
              defaultValue={defaultWord}
              className="bg-background h-11"
              required
              autoFocus={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="translation"
              className="text-foreground font-medium"
            >
              Traduction
            </Label>
            <Input
              id="translation"
              name="translation"
              defaultValue={initialData?.translation || ''}
              placeholder="Ex: Bonjour, Maison..."
              className="bg-background h-11"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Catégorie</Label>
          <TagSelector
            selectedTag={selectedTag}
            onSelectTag={(tag) =>
              setSelectedTag((prev) => (prev === tag ? null : tag))
            }
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            {isEditing && initialData?.customAudio
              ? "Nouvel audio (remplacera l'actuel)"
              : 'Prononciation'}
          </Label>
          <AudioRecorder onAudioReady={setAudioFile} />
        </div>

        <SynonymSelector
          currentLangId={langId}
          currentWord={defaultWord}
          selectedSynonyms={selectedSynonyms}
          setSelectedSynonyms={setSelectedSynonyms}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full text-base shadow-md"
        >
          {isEditing ? 'Enregistrer les modifications' : 'Enregistrer la fiche'}
        </Button>
      </form>
    </div>
  )
}
