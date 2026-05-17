import { redirect } from 'next/navigation';

import { getDueCards } from '@/actions/review-actions';
import { ReviewSessionContainer } from '@/components/review/ReviewSessionContainer';
import { SimulationModeBanner } from '@/components/review/SimulationModeBanner';
import { createClient } from '@/lib/supabase/server';
import { ReviewMode, reviewPageSearchSchema } from '@/lib/validation/schemas';
import { resolveActiveLanguageForUser } from '@/lib/services/language-service';
import prisma from '@/lib/prisma';
import { generateMockCards } from '@/lib/mock-data';

export const metadata = {
  title: 'Révision | Lugva Linda',
};

type ReviewSearchParams = {
  [key: string]: string | string[] | undefined;
};

type ReviewPageProps = {
  searchParams: Promise<ReviewSearchParams>;
};

const DEFAULT_DUE_LIMIT = 10;

const buildReviewHref = (state: ReviewSearchParams) => {
  const searchParams = new URLSearchParams();
  if (typeof state.lang === 'string') searchParams.set('lang', state.lang);
  if (typeof state.mode === 'string') searchParams.set('mode', state.mode);
  if (typeof state.sim === 'string') searchParams.set('sim', state.sim);
  if (typeof state.simPanel === 'string')
    searchParams.set('simPanel', state.simPanel);

  const query = searchParams.toString();
  return query.length > 0 ? `/review?${query}` : '/review';
};

const resolveLanguageId = async (requestedLanguageId?: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { activeLanguageId } = await resolveActiveLanguageForUser(
    { id: user.id, email: user.email },
    requestedLanguageId,
  );

  if (!activeLanguageId) {
    redirect('/setup');
  }

  return activeLanguageId;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const rawSearchParams = await searchParams;
  const parsedSearchParams = reviewPageSearchSchema
    .catch({})
    .parse(rawSearchParams);

  const languageId = await resolveLanguageId(parsedSearchParams.lang);
  const language = await prisma.language.findUnique({
    where: { id: languageId },
  });
  const activeLanguageName = language?.name || 'Langue inconnue';

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSimulationEnabled = isDevelopment && parsedSearchParams.sim !== 'off';
  const isSimulationPanelVisible =
    isDevelopment && parsedSearchParams.simPanel !== 'hide';

  const requestedMode = rawSearchParams.mode;
  const isEarlyMode = requestedMode === 'ALLOW_EARLY';
  const isPracticeMode = requestedMode === 'PRACTICE';

  const sessionSize = parsedSearchParams.fill ?? DEFAULT_DUE_LIMIT;

  let reviewSelectionMode: ReviewMode = 'DUE_ONLY';
  if (isEarlyMode) reviewSelectionMode = 'ALLOW_EARLY';
  if (isPracticeMode) reviewSelectionMode = 'PRACTICE';

  const simulationState: ReviewSearchParams = {
    lang: languageId,
    mode: requestedMode,
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

  const cardsToReview =
    isSimulationEnabled && isDevelopment
      ? generateMockCards(sessionSize)
      : await getDueCards({
          languageId,
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
        initialCards={cardsToReview}
        mode={reviewSelectionMode}
        languageName={activeLanguageName}
        isSimulationMode={isSimulationEnabled}
      />
    </main>
  );
}
