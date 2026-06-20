'use client';

import React from 'react';
import { CardFace } from './CardFace';
import { AudioPlayer, RichTextViewer } from '@/components/shared';
import { Badge, Button } from '@/components/ui';
import { Eye, EyeClosed } from 'lucide-react';
import { Word } from '@prisma/client';
import { NotesBlock } from '@/lib/words/notes';

type VersoCardProps = {
  word: Word;
  mainText?: string;
};

export const VersoCard = ({ word, mainText }: VersoCardProps) => {
  const [isNotesVisible, setNotesVisible] = React.useState<boolean>(false);

  return (
    <CardFace
      isBack
      className="bg-secondary text-secondary-foreground border-border gap-4 shadow-xl"
    >
      <h2 className="text-primary text-center text-3xl font-bold">
        {mainText}
      </h2>

      {word.relatedWords && word.relatedWords.length > 0 && !isNotesVisible && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {word.relatedWords.map((relatedWord, idx) => (
            <span key={idx} className="text-sm italic opacity-80">
              {relatedWord}
              {idx < word.relatedWords.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {word.tags.length > 1 && !isNotesVisible && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {word.tags.map((tag, index) => {
            if (index === 0) return undefined;
            return (
              <Badge
                key={tag + String(index)}
                variant="outline"
                className="text-sm"
              >
                <span className="flex items-center justify-center gap-1">
                  {tag}
                </span>
              </Badge>
            );
          })}
        </div>
      )}

      {word.customAudioUrl && !isNotesVisible && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <AudioPlayer audioUrl={word.customAudioUrl} />
        </div>
      )}

      {word.notesBlocks && (
        <>
          <Button
            variant="default"
            size="icon-sm"
            className="border-accent absolute bottom-2 left-[50%] z-10 -translate-x-[50%] rounded-full border-4"
            onClick={(e) => {
              e.stopPropagation();
              setNotesVisible(!isNotesVisible);
            }}
          >
            {isNotesVisible ? <EyeClosed /> : <Eye />}
          </Button>

          {isNotesVisible && (
            <div className="max-h-full w-full overflow-y-auto px-3">
              <RichTextViewer blocks={word.notesBlocks as NotesBlock[]} />
            </div>
          )}
        </>
      )}
    </CardFace>
  );
};
