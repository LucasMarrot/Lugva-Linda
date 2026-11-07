import { describe, expect, it } from 'vitest';
import { MANDATORY_TAGS } from '@/lib/words/tags';
import {
  createIncompleteWordFormSchema,
  proposedTermSchema,
} from '@/lib/validation/schemas';

describe('proposedTermSchema', () => {
  it('accepte un champ absent et le normalise en null', () => {
    expect(proposedTermSchema.parse(undefined)).toBeNull();
  });

  it('normalise une chaîne vide ou blanche en null', () => {
    expect(proposedTermSchema.parse('')).toBeNull();
    expect(proposedTermSchema.parse('   ')).toBeNull();
  });

  it('retourne la proposition sans espaces superflus', () => {
    expect(proposedTermSchema.parse('  Caminar ')).toBe('Caminar');
  });

  it('refuse une proposition de plus de 128 caractères', () => {
    expect(() => proposedTermSchema.parse('a'.repeat(129))).toThrow();
  });
});

describe('createIncompleteWordFormSchema', () => {
  it('reste valide sans proposition', () => {
    const result = createIncompleteWordFormSchema.safeParse({
      translation: 'Marcher',
      proposedTerm: '',
      mandatoryTag: MANDATORY_TAGS[0],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.proposedTerm).toBeNull();
  });

  it('accepte une proposition facultative renseignée', () => {
    const result = createIncompleteWordFormSchema.safeParse({
      translation: 'Marcher',
      proposedTerm: 'Caminar',
      mandatoryTag: MANDATORY_TAGS[0],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.proposedTerm).toBe('Caminar');
  });
});
