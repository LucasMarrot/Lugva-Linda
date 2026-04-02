import { normalizeForLookup } from '@/lib/words/normalization';
import type { WordMergeStrategy } from '@/lib/words/community';

export const scoreSearchResult = (
  query: string,
  word: { term: string; translation: string },
) => {
  const normalizedQuery = normalizeForLookup(query);
  const term = normalizeForLookup(word.term);
  const translation = normalizeForLookup(word.translation);

  if (term === normalizedQuery) return 6;
  if (term.startsWith(normalizedQuery)) return 5;
  if (translation.startsWith(normalizedQuery)) return 4;
  if (term.includes(normalizedQuery)) return 3;
  if (translation.includes(normalizedQuery)) return 2;
  return 1;
};

export const mergeArrayValues = (
  currentValues: string[],
  incomingValues: string[],
  mode: WordMergeStrategy['tags'],
) => {
  if (mode === 'keep') return currentValues;
  if (mode === 'replace') return incomingValues;

  const merged = new Set<string>([...currentValues, ...incomingValues]);
  return Array.from(merged);
};

export const mergeNotesValue = (
  currentValue: string | null,
  incomingValue: string | null,
  mode: WordMergeStrategy['notes'],
) => {
  if (mode === 'keep') return currentValue;
  if (mode === 'replace') return incomingValue;

  if (!currentValue) return incomingValue;
  if (!incomingValue) return currentValue;

  return `${currentValue}\n\n${incomingValue}`;
};
