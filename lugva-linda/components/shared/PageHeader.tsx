import { Button } from '../ui';
import { ArrowLeft, X } from 'lucide-react';

type PageHeaderProps = {
  title?: string;
  onCancel?: () => void;
  onClose?: () => void;
};

export const PageHeader = ({ title, onCancel, onClose }: PageHeaderProps) => {
  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/70 sticky top-0 z-10 mb-2 flex w-full items-center gap-2 border-b px-3 pt-(--safe-area-top) pb-3 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-2 p-4 pb-0">
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="text-muted-foreground size-6" />
          </Button>
        )}
        <h3 className="text-muted-foreground text-md font-semibold uppercase">
          {title}
        </h3>
        {onClose && (
          <Button variant="ghost" onClick={onClose} size="icon">
            <X className="text-muted-foreground size-6" />
          </Button>
        )}
      </div>
    </header>
  );
};
