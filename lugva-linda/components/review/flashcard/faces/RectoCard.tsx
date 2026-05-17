'use client';

import { CardFace } from './CardFace';

type RectoCardProps = {
  text: string;
};

export const RectoCard = ({ text }: RectoCardProps) => {
  return (
    <CardFace className="bg-primary text-primary-foreground border-primary shadow-xl">
      <h2 className="text-center text-4xl font-bold tracking-tight">{text}</h2>
    </CardFace>
  );
};
