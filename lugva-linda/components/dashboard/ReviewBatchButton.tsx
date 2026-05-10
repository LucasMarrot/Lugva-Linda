import Link from 'next/link';
import { Button } from '@/components/ui';

type ReviewBatchButtonProps = {
  count: number;
  languageId: string;
};

export const ReviewBatchButton = ({
  count,
  languageId,
}: ReviewBatchButtonProps) => {
  const reviewHref = `/review?lang=${languageId}&mode=PRACTICE&fill=${count}`;

  return (
    <Button asChild className="flex w-full items-center gap-2 shadow-sm">
      <Link href={reviewHref}>
        <span className="text-sm opacity-90">Révisez</span>
        <span className="text-lg font-bold">{count}</span>
        <span className="text-sm opacity-90">Mots</span>
      </Link>
    </Button>
  );
};
