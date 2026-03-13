import { redirect } from 'next/navigation';
import { getDueWords } from '@/actions/review-actions';
import { ReviewSessionContainer } from '@/components/review/ReviewSessionContainer';
import { generateMockWords } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Révision | Lugva Linda',
};

const USE_MOCK_DATA = true;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  // ==========================================
  // MODE SIMULATION (MOCK)
  // ==========================================
  if (USE_MOCK_DATA) {
    const mockWords = generateMockWords(10);
    return (
      <main className="bg-background text-foreground min-h-screen">
        <ReviewSessionContainer initialWords={mockWords} />
      </main>
    );
  }

  // ==========================================
  // PRODUCTION (VRAIES DONNÉES)
  // ==========================================
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  let languageId = params.lang;

  if (!languageId) {
    const defaultLanguage = await prisma.language.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultLanguage) {
      redirect('/setup');
    }
    languageId = defaultLanguage.id;
  }

  const wordsToReview = await getDueWords(languageId, 20);

  return (
    <main className="bg-background text-foreground min-h-screen">
      <ReviewSessionContainer initialWords={wordsToReview} />
    </main>
  );
}
