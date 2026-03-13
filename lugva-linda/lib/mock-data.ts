import type { Word } from '@prisma/client';

/**
 * Génère un tableau de mots factices respectant strictement le type Prisma Word mis à jour.
 */
export const generateMockWords = (count: number = 10): Word[] => {
  return Array.from({ length: count }).map((_, index) => {
    const isEven = index % 2 === 0;

    return {
      id: `mock-word-id-${index}`,
      word: `Mot cible ${index + 1}`,
      translation: `Traduction simulée ${index + 1}`,
      synonyms: isEven ? ['Synonyme A', 'Synonyme B'] : [],
      tags: ['Mock', isEven ? 'Verbe' : 'Nom'],
      example: "Ceci est une phrase d'exemple générée automatiquement.",
      notes: null,
      customAudio: null,

      createdAt: new Date(),
      updatedAt: new Date(),

      // Paramètres FSRS
      due: new Date(),
      stability: 0,
      difficulty: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 1,
      lastReview: null,
      userId: 'mock-user-id',
      languageId: 'mock-language-id',
      categoryId: null,
    };
  });
};
