import { Card, CardContent } from '@/components/ui';

export const DashboardStatsSkeleton = () => {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/10 border-primary/20 shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-5">
            <div className="bg-muted/60 mb-1 h-7 w-7 animate-pulse rounded-full" />
            <div className="bg-muted/60 mt-1 h-9 w-12 animate-pulse rounded-md" />
            <div className="bg-muted/40 mt-2 h-2.5 w-24 animate-pulse rounded-sm" />
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-5">
            <div className="bg-muted/60 mb-1 h-7 w-7 animate-pulse rounded-full" />
            <div className="bg-muted/60 mt-1 h-9 w-12 animate-pulse rounded-md" />
            <div className="bg-muted/40 mt-2 h-2.5 w-20 animate-pulse rounded-sm" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
