import { describe, it, expect } from 'vitest';
import {
  findEntryIndex,
  getAdjacentIndex,
  getEntryKey,
  getNavigableEntries,
} from '@/lib/words/navigation';

type Entry = { id: string; term: string };

// Un mot principal "chat" (id 1) avec un synonyme "minou" : deux entrées
// partagent le même id mais ont un terme d'affichage différent.
const list: Entry[] = [
  { id: '0', term: 'arbre' },
  { id: '1', term: 'chat' },
  { id: '2', term: 'chien' },
  { id: '1', term: 'minou' },
  { id: '3', term: 'maison' },
];

describe('getEntryKey()', () => {
  it('distinguishes synonym entries that share the same word id', () => {
    expect(getEntryKey({ id: '1', term: 'chat' })).not.toBe(
      getEntryKey({ id: '1', term: 'minou' }),
    );
  });
});

describe('findEntryIndex()', () => {
  it('returns the position of the synonym entry, not the main word entry', () => {
    expect(findEntryIndex(list, { id: '1', term: 'minou' })).toBe(3);
  });

  it('returns -1 when the entry is not in the list', () => {
    expect(findEntryIndex(list, { id: '9', term: 'absent' })).toBe(-1);
  });
});

describe('getNavigableEntries()', () => {
  it('excludes words to complete, which have no detail sheet', () => {
    const entries = [
      { id: '1', term: 'chat', status: 'ACTIVE' as const },
      { id: '2', term: 'chien', status: 'TO_COMPLETE' as const },
      { id: '3', term: 'maison', status: 'ACTIVE' as const },
    ];

    expect(getNavigableEntries(entries).map((e) => e.term)).toEqual([
      'chat',
      'maison',
    ]);
  });

  it('keeps the list order', () => {
    const entries = [
      { id: '3', term: 'maison', status: 'ACTIVE' as const },
      { id: '1', term: 'arbre', status: 'ACTIVE' as const },
    ];

    expect(getNavigableEntries(entries).map((e) => e.term)).toEqual([
      'maison',
      'arbre',
    ]);
  });
});

describe('getAdjacentIndex()', () => {
  it('moves to the next entry in list order from a synonym entry', () => {
    const current = findEntryIndex(list, { id: '1', term: 'minou' });
    expect(getAdjacentIndex(list.length, current, 'next')).toBe(4);
  });

  it('moves to the previous entry in list order', () => {
    const current = findEntryIndex(list, { id: '2', term: 'chien' });
    expect(getAdjacentIndex(list.length, current, 'prev')).toBe(1);
  });

  it('wraps from the last entry to the first on next', () => {
    expect(getAdjacentIndex(list.length, 4, 'next')).toBe(0);
  });

  it('wraps from the first entry to the last on prev', () => {
    expect(getAdjacentIndex(list.length, 0, 'prev')).toBe(4);
  });

  it('returns null when the current entry is unknown', () => {
    expect(getAdjacentIndex(list.length, -1, 'next')).toBeNull();
  });

  it('returns null when there is no other entry to go to', () => {
    expect(getAdjacentIndex(1, 0, 'next')).toBeNull();
  });
});
