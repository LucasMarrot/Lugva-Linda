'use client'

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
// import { createLanguage } from '@/actions/language-actions'
import type { Language } from '@prisma/client'

type LanguageSelectorProps = {
  languages: Language[]
}

export const LanguageSelector = ({ languages }: LanguageSelectorProps) => {
  return (
    <Select>
      <SelectTrigger className="border-border bg-background h-9 w-[130px] focus:ring-0">
        <SelectValue placeholder="Langue" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            {lang.name}
          </SelectItem>
        ))}

        <Dialog>
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
            <form className="space-y-4 pt-4">
              <Input name="name" placeholder="Nom (ex: Anglais)" required />
              <Input
                name="code"
                placeholder="Code (ex: EN)"
                maxLength={2}
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
