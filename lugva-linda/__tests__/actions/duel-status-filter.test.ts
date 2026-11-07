import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMany = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  default: { word: { findMany } },
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ id: 'user-1' })),
}));

import { generateDuelDeck } from '@/actions/duel-actions';

describe('generateDuelDeck', () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("n'utilise que des mots actifs (les mots à compléter sont exclus)", async () => {
    await generateDuelDeck('challenger-1', 'target-1', 'lang-1');

    expect(findMany).toHaveBeenCalled();
    for (const [args] of findMany.mock.calls) {
      expect(args.where).toMatchObject({ status: 'ACTIVE' });
    }
  });
});
