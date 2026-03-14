import { redirect } from 'next/navigation';

import { getDueWords } from '@/actions/review-actions';
import { ReviewSessionContainer } from '@/components/review/ReviewSessionContainer';
import { SimulationModeBanner } from '@/components/review/SimulationModeBanner';
import { generateMockWords } from '@/lib/mock-data';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { reviewPageSearchSchema } from '@/lib/validation/schemas';

export const metadata = {
  title: 'Révision | Lugva Linda',
};

type ReviewSearchParams = {
  lang?: string;
  fill?: string;
  sim?: 'on' | 'off';
  simPanel?: 'show' | 'hide';
};

type ReviewUrlState = {
  lang?: string;
  fill?: number;
  sim?: 'on' | 'off';
  simPanel?: 'show' | 'hide';
};

type ReviewPageProps = {
  searchParams: Promise<ReviewSearchParams>;
};

const DEFAULT_DUE_LIMIT = 20;

const buildReviewHref = (state: ReviewUrlState) => {
  const searchParams = new URLSearchParams();

  if (state.lang) searchParams.set('lang', state.lang);
  if (typeof state.fill === 'number')
    searchParams.set('fill', String(state.fill));
  if (state.sim) searchParams.set('sim', state.sim);
  if (state.simPanel) searchParams.set('simPanel', state.simPanel);

  const query = searchParams.toString();
  return query.length > 0 ? `/review?${query}` : '/review';
};

const resolveLanguageId = async (requestedLanguageId?: string) => {
  if (requestedLanguageId) {
    return requestedLanguageId;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const defaultLanguage = await prisma.language.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!defaultLanguage) {
    redirect('/setup');
  }

  return defaultLanguage.id;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const rawSearchParams = await searchParams;
  const parsedSearchParams = reviewPageSearchSchema
    .catch({})
    .parse(rawSearchParams);

  const languageId = await resolveLanguageId(parsedSearchParams.lang);
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSimulationEnabled = isDevelopment && parsedSearchParams.sim !== 'off';
  const isSimulationPanelVisible =
    isDevelopment && parsedSearchParams.simPanel !== 'hide';

  const isForcedFill = typeof parsedSearchParams.fill === 'number';
  const sessionSize = parsedSearchParams.fill ?? DEFAULT_DUE_LIMIT;
  const reviewSelectionMode = isForcedFill ? 'ALLOW_EARLY' : 'DUE_ONLY';

  const simulationState: ReviewUrlState = {
    lang: languageId,
    fill: parsedSearchParams.fill,
    sim: parsedSearchParams.sim,
    simPanel: parsedSearchParams.simPanel,
  };

  const simulationOnHref = buildReviewHref({
    ...simulationState,
    sim: 'on',
  });
  const simulationOffHref = buildReviewHref({
    ...simulationState,
    sim: 'off',
  });
  const simulationHideHref = buildReviewHref({
    ...simulationState,
    simPanel: 'hide',
  });

  const wordsToReview =
    isSimulationEnabled && isDevelopment
      ? generateMockWords(sessionSize)
      : await getDueWords(languageId, {
          limit: sessionSize,
          mode: reviewSelectionMode,
        });

  return (
    <main className="bg-background text-foreground min-h-screen">
      {isDevelopment && (
        <SimulationModeBanner
          isVisible={isSimulationPanelVisible}
          isSimulationEnabled={isSimulationEnabled}
          onHref={simulationOnHref}
          offHref={simulationOffHref}
          hideHref={simulationHideHref}
        />
      )}

      <ReviewSessionContainer
        initialWords={wordsToReview}
        sessionIntent={
          isForcedFill
            ? { mode: 'FORCED_FILL', targetCount: sessionSize }
            : { mode: 'DUE_ONLY' }
        }
      />
    </main>
  );
}
