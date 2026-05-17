'use client';

import { Button } from '@/components/ui';
import { ArrowBigRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type NextButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export const NextButton = ({
  onClick,
  disabled,
  className,
}: NextButtonProps) => {
  return (
    <Button
      size="lg"
      className={cn('h-14 w-full text-lg font-bold', className)}
      onClick={onClick}
      disabled={disabled}
    >
      Suivant
      <ArrowBigRight className="ml-2 h-5 w-5" />
    </Button>
  );
};
