import { describe, it, expect } from 'vitest';
import { getDueWordsSchema } from '@/lib/validation/schemas';

const languageId = '123e4567-e89b-42d3-a456-426614174000';

describe('getDueWordsSchema', () => {
  it('laisse la limite absente pour la révision du jour (pas de plafond)', () => {
    const parsed = getDueWordsSchema.parse({
      languageId,
      mode: 'DUE_ONLY',
    });

    expect(parsed.limit).toBeUndefined();
  });

  it('accepte une limite explicite pour l’entraînement libre', () => {
    const parsed = getDueWordsSchema.parse({
      languageId,
      limit: 20,
      mode: 'PRACTICE',
    });

    expect(parsed.limit).toBe(20);
  });

  it('rejette une limite explicite hors bornes', () => {
    expect(() =>
      getDueWordsSchema.parse({ languageId, limit: 0, mode: 'DUE_ONLY' }),
    ).toThrow();
    expect(() =>
      getDueWordsSchema.parse({ languageId, limit: 101, mode: 'DUE_ONLY' }),
    ).toThrow();
  });
});
