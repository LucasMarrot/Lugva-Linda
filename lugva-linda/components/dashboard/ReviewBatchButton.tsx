import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ReviewBatchButtonProps = {
  count: number;
  languageId: string;
};

export const ReviewBatchButton = ({
  count,
  languageId,
}: ReviewBatchButtonProps) => {
  const reviewHref = `/review?lang=${languageId}&fill=${count}`;

  return (
    <Button asChild className="flex h-14 flex-col gap-1 shadow-sm">
      <Link href={reviewHref}>
        <span className="text-[10px] uppercase opacity-90">Révisez</span>
        <span className="text-lg font-bold">{count}</span>
        <span className="text-[10px] uppercase opacity-90">Mots</span>
      </Link>
    </Button>
  );
};
