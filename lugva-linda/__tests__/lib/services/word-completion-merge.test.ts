import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  word: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  card: { createMany: vi.fn() },
}));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    word: mocks.word,
    card: mocks.card,
    $transaction: vi.fn(async (arg: unknown) =>
      Array.isArray(arg)
        ? Promise.all(arg)
        : (arg as (tx: unknown) => unknown)(prisma),
    ),
  };
  return { default: prisma };
});

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/push/push-service', () => ({
  sendWordCompletedNotification: vi.fn(async () => undefined),
  sendWordAssignedNotification: vi.fn(async () => undefined),
}));

import { completeWordForContributor } from '@/lib/services/word-service';

const OWNER_ID = 'learner-1';
const PLACEHOLDER = {
  id: 'word-pending',
  ownerId: OWNER_ID,
  languageId: 'lang-1',
  status: 'TO_COMPLETE',
  translation: 'Peut-être',
  translationNormalized: 'peut-etre',
  mandatoryTag: 'Adverbe',
  synonyms: [],
  relatedWords: [],
  term: '?-uuid',
};
const MAYBE = {
  id: 'word-maybe',
  ownerId: OWNER_ID,
  languageId: 'lang-1',
  status: 'ACTIVE',
  term: 'Maybe',
  translation: 'Peut-être',
  translationNormalized: 'peut-etre',
  synonyms: [],
  relatedWords: [],
};

describe('completeWordForContributor — fusion en synonyme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.word.findUnique.mockResolvedValue(PLACEHOLDER);
    mocks.word.update.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({
        id: where.id,
        term: where.id === MAYBE.id ? 'Maybe' : '?-uuid',
        synonyms: data.synonyms ?? [],
      }),
    );
  });

  it('ajoute le terme aux synonymes du concept de même traduction, sans créer de cartes', async () => {
    mocks.word.findFirst
      .mockResolvedValueOnce(MAYBE) // concept existant
      .mockResolvedValue(null);

    const result = await completeWordForContributor(
      OWNER_ID,
      PLACEHOLDER.id,
      'Perhaps',
    );

    expect(mocks.word.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          translationNormalized: 'peut-etre',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(result.mergedIntoTerm).toBe('Maybe');
    expect(mocks.word.update).toHaveBeenCalledWith({
      where: { id: MAYBE.id },
      data: { synonyms: ['Perhaps'] },
    });
    expect(mocks.word.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PLACEHOLDER.id },
        data: expect.objectContaining({ isDeleted: true }),
      }),
    );
    expect(mocks.card.createMany).not.toHaveBeenCalled();
  });

  it('refuse la fusion si le terme est identique au concept existant', async () => {
    // 1er appel : concept de même traduction (même terme) ;
    // 2e appel : contrôle de doublon, qui trouve le mot existant.
    mocks.word.findFirst
      .mockResolvedValueOnce({ ...MAYBE, term: 'Perhaps' })
      .mockResolvedValueOnce({ id: MAYBE.id });

    await expect(
      completeWordForContributor(OWNER_ID, PLACEHOLDER.id, 'Perhaps'),
    ).rejects.toThrow('Ce mot existe deja avec cette nature.');
    expect(mocks.card.createMany).not.toHaveBeenCalled();
  });

  it("complète normalement s'il n'existe aucun concept de même traduction", async () => {
    mocks.word.findFirst.mockResolvedValue(null);

    const result = await completeWordForContributor(
      OWNER_ID,
      PLACEHOLDER.id,
      'Perhaps',
    );

    expect(result.mergedIntoTerm).toBeNull();
    expect(mocks.word.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PLACEHOLDER.id },
        data: expect.objectContaining({ term: 'Perhaps', status: 'ACTIVE' }),
      }),
    );
    expect(mocks.card.createMany).toHaveBeenCalledTimes(1);
  });
});
