import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mergeArrayValues,
  mergeNotesValue,
  scoreSearchResult,
} from '../../lib/services/community-merge';

const buildWord = (term: string, translation: string) => ({
  term,
  translation,
});

test('mergeArrayValues merges without duplicates when mode is merge', () => {
  const output = mergeArrayValues(
    ['nom', 'verbe'],
    ['verbe', 'adjectif'],
    'merge',
  );
  assert.deepEqual(output, ['nom', 'verbe', 'adjectif']);
});

test('mergeArrayValues keeps current values when mode is keep', () => {
  const output = mergeArrayValues(['a'], ['b'], 'keep');
  assert.deepEqual(output, ['a']);
});

test('mergeNotesValue appends notes when mode is merge', () => {
  const output = mergeNotesValue('ancienne note', 'nouvelle note', 'merge');
  assert.equal(output, 'ancienne note\n\nnouvelle note');
});

test('scoreSearchResult prioritizes exact term over partial translation', () => {
  const exact = buildWord('bonjour', 'hello');
  const partial = buildWord('bonsoir', 'bonjour ami');

  assert.ok(
    scoreSearchResult('bonjour', exact) > scoreSearchResult('bonjour', partial),
  );
});
