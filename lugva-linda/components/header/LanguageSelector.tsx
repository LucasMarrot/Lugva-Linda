'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Language } from '@prisma/client'
import { createLanguage } from '@/actions/language-actions'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type LanguageSelectorProps = {
  languages: Language[]
}

export const LanguageSelector = ({ languages }: LanguageSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const currentLangId =
    searchParams.get('lang') || (languages.length > 0 ? languages[0].id : '')

  const handleLanguageChange = (langId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', langId)
    router.push(`/?${params.toString()}`)
  }

  const handleCreateLanguage = async (formData: FormData) => {
    await createLanguage(formData)
    setIsDialogOpen(false)
  }

  return (
    <Select value={currentLangId} onValueChange={handleLanguageChange}>
      <SelectTrigger className="border-border bg-background h-9 w-[130px] focus:ring-0">
        <SelectValue placeholder="Langue" />
      </SelectTrigger>

      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            {lang.name}
          </SelectItem>
        ))}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/90 hover:bg-muted w-full justify-start px-2 font-medium"
            >
              + Nouvelle langue
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une langue</DialogTitle>
            </DialogHeader>
            <form action={handleCreateLanguage} className="space-y-4 pt-4">
              <Input
                name="name"
                placeholder="Nom de la langue (ex: Anglais)"
                required
              />
              <Button type="submit" className="w-full">
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </SelectContent>
    </Select>
  )
}
