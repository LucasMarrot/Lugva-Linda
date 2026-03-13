'use client';

import { CardFace } from './CardFace';

type RectoCardProps = {
  word: string;
};

export const RectoCard = ({ word }: RectoCardProps) => {
  return (
    <CardFace className="bg-primary text-primary-foreground border-primary shadow-xl">
      <h2 className="text-center text-4xl font-bold tracking-tight">{word}</h2>
    </CardFace>
  );
};
