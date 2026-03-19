import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canDeleteWord,
  canEditWord,
  canReadWord,
} from '../../lib/services/word-policies';

test('canReadWord checks language scope', () => {
  assert.equal(canReadWord({ languageId: 'lang-1' }, 'lang-1'), true);
  assert.equal(canReadWord({ languageId: 'lang-1' }, 'lang-2'), false);
});

test('canEditWord checks owner scope', () => {
  assert.equal(canEditWord({ ownerId: 'user-1' }, 'user-1'), true);
  assert.equal(canEditWord({ ownerId: 'user-1' }, 'user-2'), false);
});

test('canDeleteWord checks owner scope', () => {
  assert.equal(canDeleteWord({ ownerId: 'user-1' }, 'user-1'), true);
  assert.equal(canDeleteWord({ ownerId: 'user-1' }, 'user-2'), false);
});
