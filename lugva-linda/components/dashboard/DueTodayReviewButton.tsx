'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, FastForward, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui';
import { frenchPluralize } from '@/lib/utils';
import { triggerConfetti } from '@/lib/confetti';

type DueTodayReviewButtonProps = {
  languageId: string;
  todayWordCount: number;
  nextSessionDate: Date | null;
  nextSessionWordCount?: number;
  colorHex?: string;
};

export const DueTodayReviewButton = ({
  languageId,
  todayWordCount,
  nextSessionDate,
  nextSessionWordCount = 0,
  colorHex,
}: DueTodayReviewButtonProps) => {
  const router = useRouter();

  const formattedDate = nextSessionDate
    ? format(nextSessionDate, 'd MMMM', { locale: fr })
    : '';

  const handleTodayReviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    triggerConfetti(e.currentTarget, colorHex);

    setTimeout(() => {
      router.push(`/review?lang=${languageId}`);
    }, 600);
  };

  if (todayWordCount > 0) {
    return (
      <Button
        className="shadow-primary/50 flex flex-col gap-0 p-6 font-semibold shadow-sm transition-transform active:scale-95"
        size="lg"
        onClick={handleTodayReviewClick}
      >
        <span className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5" /> Réviser la séance du jour
        </span>
        <span className="text-xs font-normal opacity-80">
          {`${formattedDate} — ${todayWordCount} ${frenchPluralize(todayWordCount, 'mot')}`}
        </span>
      </Button>
    );
  }

  if (nextSessionDate) {
    return (
      <Button
        asChild
        variant="outlinePrimary"
        className="shadow-primary/50 flex flex-col gap-0 p-6 font-semibold shadow-sm"
        size="lg"
      >
        <Link href={`/review?lang=${languageId}&mode=ALLOW_EARLY`}>
          <span className="flex items-center gap-2 text-base">
            <FastForward className="h-5 w-5" /> S&apos;avancer sur les révisions
          </span>
          <span className="text-xs font-normal opacity-80">
            {`${formattedDate} — ${nextSessionWordCount} ${frenchPluralize(nextSessionWordCount, 'mot')}`}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <Button size="lg" disabled>
      <CheckCircle className="mr-2 h-5 w-5" />
      Aucune révision prévue
    </Button>
  );
};
