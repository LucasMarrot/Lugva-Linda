import { normalizeForLookup } from '@/lib/words/normalization';
import type { WordMergeStrategy } from '@/lib/words/community';
import type { NotesBlock } from '@/lib/words/notes';

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

export const mergeNotesBlocksValue = (
  currentValue: NotesBlock[] | null,
  incomingValue: NotesBlock[] | null,
  mode: WordMergeStrategy['notes'],
) => {
  if (mode === 'keep') return currentValue;
  if (mode === 'replace') return incomingValue;

  if (!currentValue || currentValue.length === 0) return incomingValue;
  if (!incomingValue || incomingValue.length === 0) return currentValue;

  const merged = [...currentValue];
  const indexById = new Map<string, number>();

  merged.forEach((block, index) => {
    indexById.set(block.id, index);
  });

  incomingValue.forEach((block) => {
    const existingIndex = indexById.get(block.id);

    if (typeof existingIndex === 'number') {
      merged[existingIndex] = block;
      return;
    }

    indexById.set(block.id, merged.length);
    merged.push(block);
  });

  return merged;
};
