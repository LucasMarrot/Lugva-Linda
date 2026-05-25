import type { Word } from '@prisma/client';
import { ReviewCard } from './validation/schemas';

/**
 * Génère un tableau de cartes factices pour la simulation.
 */
export const generateMockCards = (count: number = 10): ReviewCard[] => {
  return Array.from({ length: count }).map((_, index) => {
    const isEven = index % 2 === 0;
    const term = `Mot cible ${index + 1}`;

    const mockWord: Word = {
      id: `mock-word-id-${index}`,
      ownerId: 'mock-user-id',
      languageId: 'mock-language-id',
      createdById: 'mock-user-id',
      term,
      termNormalized: term.toLowerCase(),
      translation: `Traduction simulée ${index + 1}`,
      translationNormalized: `traduction simulée ${index + 1}`,
      mandatoryTag: isEven ? 'Verbe' : 'Nom',
      synonyms: isEven ? ['Synonyme A', 'Synonyme B'] : [],
      tags: ['Mock', isEven ? 'Verbe' : 'Nom'],
      relatedWords: isEven ? ['Mot lié A'] : [],
      notesBlocks: null,
      customAudioPath: null,
      customAudioUrl: null,
      sourceWordId: null,
      isDeleted: false,
      deletedAt: null,
      purgeAfter: null,
      deleteToken: BigInt(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      id: `mock-card-id-${index}`,
      wordId: mockWord.id,
      ownerId: 'mock-user-id',
      languageId: 'mock-language-id',
      category: 'READING',
      type: 'RECOGNITION',
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      lastReview: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      word: mockWord,
    };
  });
};
