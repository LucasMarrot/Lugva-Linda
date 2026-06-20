'use client';

import { useMemo, useState } from 'react';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/components/ui';

import { useActiveLanguage } from '@/components/providers/ActiveLanguageProvider';
import CreateLanguageModal from './CreateLanguageModal';

export const LanguageSelector = () => {
  const { languages, activeLanguageId, isSwitchingLanguage, setLanguage } =
    useActiveLanguage();
  const [isCreateLanguageModalOpen, setIsCreateLanguageModalOpen] =
    useState(false);

  const existingLanguageNames = useMemo(
    () => languages.map((language) => language.name),
    [languages],
  );

  const currentLangId = activeLanguageId;

  const handleLanguageChange = async (langId: string) => {
    await setLanguage(langId);
  };

  return (
    <>
      <Select
        value={currentLangId}
        onValueChange={handleLanguageChange}
        disabled={isSwitchingLanguage}
      >
        <SelectTrigger className="border-border bg-background h-9 w-32.5 focus:ring-0">
          <SelectValue placeholder="Langue" />
        </SelectTrigger>

        <SelectContent>
          {languages.map((lang) => (
            <SelectItem
              key={lang.id}
              value={lang.id}
              className="cursor-pointer"
            >
              {lang.name}
            </SelectItem>
          ))}

          <Separator />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2"
            disabled={isSwitchingLanguage}
            onClick={() => setIsCreateLanguageModalOpen(true)}
          >
            + Nouvelle langue
          </Button>
        </SelectContent>
      </Select>

      <CreateLanguageModal
        isOpen={isCreateLanguageModalOpen}
        onOpenChange={setIsCreateLanguageModalOpen}
        existingLanguageNames={existingLanguageNames}
      />
    </>
  );
};
