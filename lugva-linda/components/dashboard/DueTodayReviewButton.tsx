import Link from 'next/link';
import { Brain } from 'lucide-react';

import { Button } from '@/components/ui/button';

type DueTodayReviewButtonProps = {
  languageId: string;
};

export const DueTodayReviewButton = ({
  languageId,
}: DueTodayReviewButtonProps) => {
  return (
    <Button
      asChild
      className="h-14 w-full justify-center gap-3 text-base font-semibold shadow-sm"
      size="lg"
    >
      <Link href={`/review?lang=${languageId}`}>
        <Brain className="h-5 w-5" />
        Réviser les échéances du jour
      </Link>
    </Button>
  );
};
