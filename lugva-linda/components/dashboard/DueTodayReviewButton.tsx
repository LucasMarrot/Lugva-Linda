import Link from 'next/link';
import { Brain, FastForward, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type DueTodayReviewButtonProps = {
  languageId: string;
  todayWordCount: number;
  nextSessionDate: Date | null;
  nextSessionWordCount: number;
};

export const DueTodayReviewButton = ({
  languageId,
  todayWordCount,
  nextSessionDate,
  nextSessionWordCount,
}: DueTodayReviewButtonProps) => {
  const formattedDate = nextSessionDate
    ? format(nextSessionDate, 'd MMMM', { locale: fr })
    : '';

  if (todayWordCount > 0) {
    return (
      <Button
        asChild
        className="shadow-primary/50 flex flex-col gap-0 shadow-sm"
        size="lg"
      >
        <Link
          href={`/review?lang=${languageId}&fill=${todayWordCount}`}
          className="p-6 font-semibold"
        >
          <span className="flex items-center gap-2">
            <Brain /> Réviser la séance du jour
          </span>
          <span className="text-xs opacity-80">{formattedDate}</span>
        </Link>
      </Button>
    );
  }

  if (nextSessionDate) {
    return (
      <Button
        asChild
        variant="outlinePrimary"
        className="shadow-primary/50 flex flex-col gap-0 shadow-sm"
        size="lg"
      >
        <Link
          href={`/review?lang=${languageId}&mode=ALLOW_EARLY&fill=${nextSessionWordCount}`}
          className="p-6 font-semibold"
        >
          <span className="flex items-center gap-2">
            <FastForward /> S&apos;avancer sur les révisions
          </span>
          <span className="text-xs opacity-80">{formattedDate}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button size="lg" disabled>
      <CheckCircle />
      Aucune révision prévue
    </Button>
  );
};
