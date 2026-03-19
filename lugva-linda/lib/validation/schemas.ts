import { z } from 'zod';
import { Rating } from 'ts-fsrs';

const validGrades = [
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
] as const;

const reviewBatchSizes = [10, 20, 30] as const;

const normalizeLabel = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const languageIdSchema = z.uuid('ID de langue invalide.');
export const wordIdSchema = z.uuid('ID de mot invalide.');

export const reviewSelectionModeSchema = z.enum(['DUE_ONLY', 'ALLOW_EARLY']);

export const gradeSchema = z
  .number()
  .int()
  .refine(
    (value): value is (typeof validGrades)[number] =>
      validGrades.includes(value as (typeof validGrades)[number]),
    'Note de revision invalide.',
  );

export const getDueWordsSchema = z.object({
  languageId: languageIdSchema,
  limit: z
    .number()
    .int('La limite doit etre un entier.')
    .min(1, 'La limite doit etre superieure ou egale a 1.')
    .max(100, 'La limite doit etre inferieure ou egale a 100.')
    .default(10),
  mode: reviewSelectionModeSchema.default('DUE_ONLY'),
});

export const processReviewSchema = z.object({
  wordId: wordIdSchema,
  grade: gradeSchema,
  durationMs: z
    .number()
    .int('La duree doit etre un entier.')
    .min(0, 'La duree doit etre positive ou nulle.')
    .optional(),
});

export const nonEmptyTextSchema = z
  .string()
  .trim()
  .min(1, 'Ce champ est obligatoire.');

export const createLanguageFormSchema = z.object({
  name: nonEmptyTextSchema.max(
    64,
    'Le nom de la langue ne doit pas depasser 64 caracteres.',
  ),
});

export const buildCreateLanguageFormSchema = (existingNames: string[]) => {
  const normalizedExistingNames = new Set(existingNames.map(normalizeLabel));

  return createLanguageFormSchema.refine(
    ({ name }) => !normalizedExistingNames.has(normalizeLabel(name)),
    {
      path: ['name'],
      message: 'La langue doit etre differente des langues existantes.',
    },
  );
};

export const loginFormSchema = z.object({
  email: z.string().trim().email('Email invalide.'),
  password: nonEmptyTextSchema.min(
    8,
    'Le mot de passe doit contenir au moins 8 caracteres.',
  ),
});

export const createWordFormSchema = z.object({
  word: nonEmptyTextSchema.max(
    128,
    'Le mot ne doit pas depasser 128 caracteres.',
  ),
  translation: nonEmptyTextSchema.max(
    256,
    'La traduction ne doit pas depasser 256 caracteres.',
  ),
});

const stringArraySchema = z.array(
  nonEmptyTextSchema.max(
    64,
    'Chaque valeur ne doit pas depasser 64 caracteres.',
  ),
);

export const wordWriteSchema = z.object({
  term: nonEmptyTextSchema.max(
    128,
    'Le terme ne doit pas depasser 128 caracteres.',
  ),
  translation: nonEmptyTextSchema.max(
    256,
    'La traduction ne doit pas depasser 256 caracteres.',
  ),
  tags: stringArraySchema.max(20, 'Maximum 20 tags.'),
  synonyms: stringArraySchema.max(20, 'Maximum 20 synonymes.'),
  relatedWords: stringArraySchema.max(20, 'Maximum 20 mots lies.'),
  notes: z
    .string()
    .trim()
    .max(2000, 'Les notes ne doivent pas depasser 2000 caracteres.')
    .nullable(),
  languageId: languageIdSchema.optional(),
});

export const reviewPageSearchSchema = z.object({
  lang: languageIdSchema.optional(),
  fill: z.coerce
    .number()
    .int('La taille de session doit etre un entier.')
    .refine(
      (value): value is (typeof reviewBatchSizes)[number] =>
        reviewBatchSizes.includes(value as (typeof reviewBatchSizes)[number]),
      'Taille de session invalide.',
    )
    .optional(),
  sim: z.enum(['on', 'off']).optional(),
  simPanel: z.enum(['show', 'hide']).optional(),
});
