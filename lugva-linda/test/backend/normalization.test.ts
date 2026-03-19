import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeForLookup,
  normalizeStringArray,
  normalizeText,
} from '../../lib/words/normalization';

test('normalizeText trims and normalizes unicode', () => {
  const value = normalizeText('  e\u0301cole  ');
  assert.equal(value, 'école');
});

test('normalizeForLookup lowercases text', () => {
  assert.equal(normalizeForLookup('  BONJour  '), 'bonjour');
});

test('normalizeStringArray removes empties and duplicates', () => {
  const output = normalizeStringArray(['  tag ', '', 'tag', 'news']);
  assert.deepEqual(output, ['tag', 'news']);
});
