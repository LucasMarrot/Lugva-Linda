import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CardFaceProps {
  children: ReactNode;
  className?: string;
  isBack?: boolean;
}

export const CardFace = ({
  children,
  className,
  isBack = false,
}: CardFaceProps) => {
  return (
    <Card
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center p-6',
        'bg-card text-card-foreground border-border shadow-lg',
        'backface-hidden',
        className,
      )}
      style={{
        backfaceVisibility: 'hidden',
        transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      {children}
    </Card>
  );
};
