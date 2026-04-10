'use client';

import { useEffect, useMemo, useState } from 'react';
import { RichTextEditor, SectionHeader } from '@/components/shared';
import {
  extractNotesTextFromBlocks,
  NOTES_MAX_LENGTH,
  serializeNotesBlocks,
  type NotesBlock,
} from '@/lib/words/notes';

type NotesSectionProps = {
  initialBlocks?: NotesBlock[] | null;
  disabled: boolean;
  onValidationChange: (hasError: boolean) => void;
};

export const NotesSection = ({
  initialBlocks = null,
  disabled,
  onValidationChange,
}: NotesSectionProps) => {
  const [notesBlocksValue, setNotesBlocksValue] = useState<NotesBlock[] | null>(
    initialBlocks,
  );

  const notesCharacterCount = useMemo(
    () => extractNotesTextFromBlocks(notesBlocksValue).length,
    [notesBlocksValue],
  );

  const notesError =
    notesCharacterCount > NOTES_MAX_LENGTH
      ? `Les notes ne doivent pas depasser ${NOTES_MAX_LENGTH} caracteres.`
      : null;

  useEffect(() => {
    onValidationChange(Boolean(notesError));
  }, [notesError, onValidationChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SectionHeader
          title="Notes"
          description={`${notesCharacterCount}/${NOTES_MAX_LENGTH}`}
        />
      </div>

      <input
        type="hidden"
        name="notesBlocks"
        value={serializeNotesBlocks(notesBlocksValue)}
      />

      <RichTextEditor
        blocks={notesBlocksValue}
        onBlocksChange={setNotesBlocksValue}
        disabled={disabled}
      />

      {notesError && (
        <p className="text-destructive text-sm font-medium">{notesError}</p>
      )}
    </div>
  );
};
