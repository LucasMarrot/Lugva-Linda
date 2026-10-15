import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Rating } from 'ts-fsrs';
import { useReviewSession } from '@/hooks/useReviewSession';
import type { ReviewCard } from '@/lib/validation/schemas';

// --- Mocks ---

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/actions/review-actions', () => ({
  processReview: vi.fn().mockResolvedValue(undefined),
}));

// --- Fixtures ---

function makeCard(id: string): ReviewCard {
  return {
    id,
    type: 'TRANSLATION_TO_NATIVE',
    term: id,
    translations: ['traduction'],
    nativeLanguageName: 'Français',
    targetLanguageName: 'Anglais',
  } as unknown as ReviewCard;
}

const CARD_A = makeCard('card-a');
const CARD_B = makeCard('card-b');

// --- Helper ---

/** Avance le hook en répondant `grade` à la carte courante */
async function rate(
  result: ReturnType<
    typeof renderHook<ReturnType<typeof useReviewSession>, unknown>
  >['result'],
  grade: Rating,
) {
  await act(async () => {
    // handleRate accepte ValidGrade (Exclude<Rating, Rating.Manual>)
    // On utilise un cast car les valeurs de test sont toujours valides
    await result.current.actions.handleRate(
      grade as Exclude<Rating, Rating.Manual>,
    );
  });
}

// --- Tests ---

describe('useReviewSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('phase normale', () => {
    it('avance à la carte suivante après une note Good', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A, CARD_B], onComplete, true),
      );

      expect(result.current.currentCard).toBeDefined();

      await rate(result, Rating.Good);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('appelle onComplete quand toutes les cartes sont validées sans lapse', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A, CARD_B], onComplete, true),
      );

      await rate(result, Rating.Good);
      await rate(result, Rating.Good);

      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('ajoute un lapse sans appeler onComplete quand une carte est notée Again', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A, CARD_B], onComplete, true),
      );

      await rate(result, Rating.Again); // CARD_A → lapse, passe à CARD_B

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('phase lapses (consolidation)', () => {
    it('affiche la transition lapses après la dernière carte normale avec lapse', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A], onComplete, true),
      );

      await rate(result, Rating.Again);

      expect(result.current.showLapseTransition).toBe(true);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("re-propose le mot tant qu'il est noté Again en phase lapses", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A], onComplete, true),
      );

      // Phase normale → Again → transition lapses
      await rate(result, Rating.Again);
      act(() => result.current.actions.dismissTransition());

      const cardId = result.current.currentCard?.id;

      // Phase lapses : Again → doit re-proposer le même mot
      await rate(result, Rating.Again);

      expect(onComplete).not.toHaveBeenCalled();
      expect(result.current.currentCard).toBeDefined();
      expect(result.current.currentCard?.id).toBe(cardId);
    });

    it('termine la session quand le lapse est validé avec Good', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A], onComplete, true),
      );

      await rate(result, Rating.Again);
      act(() => result.current.actions.dismissTransition());

      await rate(result, Rating.Good);

      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('termine après plusieurs cycles Again puis un Good', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A], onComplete, true),
      );

      await rate(result, Rating.Again);
      act(() => result.current.actions.dismissTransition());

      await rate(result, Rating.Again); // cycle 1
      expect(onComplete).not.toHaveBeenCalled();

      await rate(result, Rating.Again); // cycle 2
      expect(onComplete).not.toHaveBeenCalled();

      await rate(result, Rating.Good); // validé → fin
      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('gère plusieurs lapses : tous doivent être validés avant la fin', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useReviewSession([CARD_A, CARD_B], onComplete, true),
      );

      // Phase normale : les deux cartes en lapse
      await rate(result, Rating.Again);
      await rate(result, Rating.Again); // → transition lapses

      act(() => result.current.actions.dismissTransition());

      // Phase lapses : valider les 2 lapses
      await rate(result, Rating.Good);
      expect(onComplete).not.toHaveBeenCalled();

      await rate(result, Rating.Good);
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });
});
