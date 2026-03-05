'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createWord } from '@/actions/word-actions'
import { SynonymSelector } from './SynonymSelector'
import { AudioRecorder } from './AudioRecorder' // <-- NOUVEL IMPORT
import { TagSelector } from './TagSelector'

type CreateWordViewProps = {
  initialQuery: string
  currentLangId: string
  onCancel: () => void
  onSuccess: () => void
}

export const CreateWordView = ({
  initialQuery,
  currentLangId,
  onCancel,
  onSuccess,
}: CreateWordViewProps) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedSynonyms, setSelectedSynonyms] = useState<string[]>([])

  const [audioFile, setAudioFile] = useState<File | null>(null)

  const handleCreate = async (formData: FormData) => {
    if (audioFile) {
      formData.append('audioFile', audioFile)
    }

    await createWord(formData)
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
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Ajouter à l'encyclopédie</h3>
      </div>

      <form action={handleCreate} className="space-y-6">
        <input type="hidden" name="languageId" value={currentLangId} />
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
              defaultValue={initialQuery}
              className="bg-background h-11"
              required
              autoFocus
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
          <Label className="text-foreground font-medium">Prononciation</Label>
          <AudioRecorder onAudioReady={setAudioFile} />
        </div>

        <SynonymSelector
          currentLangId={currentLangId}
          currentWord={initialQuery}
          selectedSynonyms={selectedSynonyms}
          setSelectedSynonyms={setSelectedSynonyms}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full text-base shadow-md"
        >
          Enregistrer la fiche
        </Button>
      </form>
    </div>
  )
}
