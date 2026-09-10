import { describe, it, expect } from 'vitest';
import {
  normalizeForLookup,
  normalizeStringArray,
  normalizeText,
} from '@/lib/words/normalization';

describe('normalizeText()', () => {
  it('trims and normalizes unicode', () => {
    const value = normalizeText('  e\u0301cole  ');
    expect(value).toBe('école');
  });
});

describe('normalizeForLookup()', () => {
  it('lowercases text for lookup', () => {
    expect(normalizeForLookup('  BONJour  ')).toBe('bonjour');
  });
});

describe('normalizeStringArray()', () => {
  it('removes empties and duplicates', () => {
    const output = normalizeStringArray(['  tag ', '', 'tag', 'news']);
    expect(output).toEqual(['tag', 'news']);
  });
});
