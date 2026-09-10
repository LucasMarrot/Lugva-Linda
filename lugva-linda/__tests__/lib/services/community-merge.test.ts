import { describe, it, expect } from 'vitest';
import {
  mergeArrayValues,
  mergeNotesValue,
  scoreSearchResult,
} from '@/lib/services/community-merge';

const buildWord = (term: string, translation: string) => ({
  term,
  translation,
});

describe('mergeArrayValues()', () => {
  it('merges without duplicates when mode is merge', () => {
    const output = mergeArrayValues(
      ['nom', 'verbe'],
      ['verbe', 'adjectif'],
      'merge',
    );
    expect(output).toEqual(['nom', 'verbe', 'adjectif']);
  });

  it('keeps current values when mode is keep', () => {
    const output = mergeArrayValues(['a'], ['b'], 'keep');
    expect(output).toEqual(['a']);
  });
});

describe('mergeNotesValue()', () => {
  it('appends notes when mode is merge', () => {
    const output = mergeNotesValue('ancienne note', 'nouvelle note', 'merge');
    expect(output).toBe('ancienne note\n\nnouvelle note');
  });
});

describe('scoreSearchResult()', () => {
  it('prioritizes exact term over partial translation', () => {
    const exact = buildWord('bonjour', 'hello');
    const partial = buildWord('bonsoir', 'bonjour ami');

    expect(scoreSearchResult('bonjour', exact)).toBeGreaterThan(
      scoreSearchResult('bonjour', partial),
    );
  });
});
