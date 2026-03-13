'use client';

import type { Word } from '@prisma/client';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { CardFace } from './CardFace';

type VersoCardProps = {
  word: Word;
};

export const VersoCard = ({ word }: VersoCardProps) => {
  return (
    <CardFace
      isBack
      className="bg-secondary text-secondary-foreground border-border gap-4 shadow-xl"
    >
      <h2 className="text-center text-3xl font-bold">{word.translation}</h2>

      {word.synonyms.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {word.synonyms.map((syn, idx) => (
            <span key={idx} className="text-sm italic opacity-80">
              {syn}
              {idx < word.synonyms.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {word.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {word.tags.map((tag, idx) => (
            <span
              key={idx}
              className="border-secondary-foreground/20 bg-background/50 text-secondary-foreground inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {word.customAudio && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <AudioPlayer audioUrl={word.customAudio} />
        </div>
      )}
    </CardFace>
  );
};
