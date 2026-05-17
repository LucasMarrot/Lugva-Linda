'use client';

import { Card, CardContent } from '@/components/ui';
import { SectionHeader } from '@/components/shared';

export const CalendarSkeleton = () => {
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="Planning des révisions" />
      <Card className="border-border w-full shadow-sm">
        <CardContent className="p-4">
          <div className="bg-muted/50 h-75 w-full animate-pulse rounded-md" />
        </CardContent>
      </Card>
    </section>
  );
};
