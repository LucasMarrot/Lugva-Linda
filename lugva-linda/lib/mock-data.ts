import type { Word } from '@prisma/client';

/**
 * Génère un tableau de mots factices respectant strictement le type Prisma Word mis à jour.
 */
export const generateMockWords = (count: number = 10): Word[] => {
  return Array.from({ length: count }).map((_, index) => {
    const isEven = index % 2 === 0;
    const term = `Mot cible ${index + 1}`;

    return {
      id: `mock-word-id-${index}`,
      ownerId: 'mock-user-id',
      languageId: 'mock-language-id',
      createdById: 'mock-user-id',
      term,
      termNormalized: term.toLowerCase(),
      translation: `Traduction simulée ${index + 1}`,
      translationNormalized: `traduction simulée ${index + 1}`,
      synonyms: isEven ? ['Synonyme A', 'Synonyme B'] : [],
      tags: ['Mock', isEven ? 'Verbe' : 'Nom'],
      relatedWords: isEven ? ['Mot lié A'] : [],
      notes: null,
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
  });
};
