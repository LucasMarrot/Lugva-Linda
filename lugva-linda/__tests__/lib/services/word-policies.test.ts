import { describe, it, expect } from 'vitest';
import {
  canDeleteWord,
  canEditWord,
  canImportWord,
  canReadWord,
} from '@/lib/services/word-policies';

describe('word-policies', () => {
  it('canReadWord checks language scope', () => {
    expect(canReadWord({ languageId: 'lang-1' }, 'lang-1')).toBe(true);
    expect(canReadWord({ languageId: 'lang-1' }, 'lang-2')).toBe(false);
  });

  it('canEditWord checks owner scope', () => {
    expect(canEditWord({ ownerId: 'user-1' }, 'user-1')).toBe(true);
    expect(canEditWord({ ownerId: 'user-1' }, 'user-2')).toBe(false);
  });

  it('canDeleteWord checks owner scope', () => {
    expect(canDeleteWord({ ownerId: 'user-1' }, 'user-1')).toBe(true);
    expect(canDeleteWord({ ownerId: 'user-1' }, 'user-2')).toBe(false);
  });

  it('canImportWord forbids importing own word', () => {
    expect(canImportWord({ ownerId: 'user-1' }, 'user-1')).toBe(false);
    expect(canImportWord({ ownerId: 'user-1' }, 'user-2')).toBe(true);
  });
});
