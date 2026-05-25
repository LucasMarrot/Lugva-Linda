'use client';

import { Tag } from 'lucide-react';
import { CardFace } from './CardFace';
import { Badge } from '@/components/ui';

type RectoCardProps = {
  text: string;
  mandatoryTag: string;
};

export const RectoCard = ({ text, mandatoryTag }: RectoCardProps) => {
  return (
    <CardFace className="bg-primary text-primary-foreground border-primary shadow-xl">
      <h2 className="text-center text-4xl font-bold tracking-tight">{text}</h2>
      <Badge
        variant="outline"
        className="text-primary-foreground border-2 text-lg"
      >
        <span className="flex items-center justify-center gap-2">
          <Tag className="h-4 w-4" />
          {mandatoryTag}
        </span>
      </Badge>
    </CardFace>
  );
};
