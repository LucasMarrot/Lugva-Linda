import { z } from 'zod';
import { Rating } from 'ts-fsrs';
import { MANDATORY_TAGS, MANDATORY_TAGS_SET } from '../words/tags';
import { extractNotesTextFromBlocks, NOTES_MAX_LENGTH } from '../words/notes';
import { USER_COLOR_OPTIONS } from '../users/colors';
import { Card, Word } from '@prisma/client';

export const REVIEW_BATCH_SIZES = [10, 20, 30] as const;

const normalizeLabel = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const languageIdSchema = z.uuid('ID de langue invalide.');
export const wordIdSchema = z.uuid('ID de mot invalide.');
export const cardIdSchema = z.uuid('ID de carte invalide.');

export const reviewSelectionModeSchema = z.enum([
  'DUE_ONLY',
  'ALLOW_EARLY',
  'PRACTICE',
]);

export type ReviewMode = z.infer<typeof reviewSelectionModeSchema>;

const validGrades = [
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
] as const;

export const gradeSchema = z
  .number()
  .int()
  .refine(
    (value): value is (typeof validGrades)[number] =>
      validGrades.includes(value as (typeof validGrades)[number]),
    'Note de revision invalide.',
  );

export type ValidGrade = z.infer<typeof gradeSchema>;

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

export type GetDueWordsOptions = z.infer<typeof getDueWordsSchema>;

export const processReviewSchema = z.object({
  cardId: cardIdSchema,
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

export const usernameSchema = nonEmptyTextSchema
  .min(3, "Le nom d'utilisateur doit contenir au moins 3 caracteres.")
  .max(32, "Le nom d'utilisateur ne doit pas depasser 32 caracteres.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Utilisez uniquement des lettres, chiffres, points, tirets ou underscores.',
  );

export const userEmailSchema = z.string().trim().email('Email invalide.');

export const userPasswordSchema = nonEmptyTextSchema.min(
  8,
  'Le mot de passe doit contenir au moins 8 caracteres.',
);

export const userColorSchema = z.enum(USER_COLOR_OPTIONS, {
  message: 'Couleur invalide.',
});

export const mandatoryTagSchema = z.enum(MANDATORY_TAGS, {
  message: 'La nature du mot est obligatoire.',
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
  mandatoryTag: mandatoryTagSchema,
});

export const checkWordTermNatureSchema = z.object({
  word: nonEmptyTextSchema.max(
    128,
    'Le mot ne doit pas depasser 128 caracteres.',
  ),
  languageId: languageIdSchema,
  mandatoryTag: mandatoryTagSchema,
  excludeWordId: wordIdSchema.optional(),
});

export const communityImportSelectionSchema = z.object({
  useCommunityTranslation: z.boolean(),
  keepOwnTranslation: z.boolean(),
  communityTagKeys: z.array(nonEmptyTextSchema.max(64)).max(50),
  keepOwnTagKeys: z.array(nonEmptyTextSchema.max(64)).max(50),
  useCommunityAudio: z.boolean(),
  keepOwnAudio: z.boolean(),
  communityNoteBlockIds: z.array(nonEmptyTextSchema.max(128)).max(500),
  keepOwnNoteBlockIds: z.array(nonEmptyTextSchema.max(128)).max(500),
});

export type CommunityImportSelection = z.infer<
  typeof communityImportSelectionSchema
>;

const stringArraySchema = z.array(
  nonEmptyTextSchema.max(
    64,
    'Chaque valeur ne doit pas depasser 64 caracteres.',
  ),
);

const notesBlockSchema = z.looseObject({
  id: nonEmptyTextSchema.max(128, 'ID de bloc invalide.'),
  type: nonEmptyTextSchema.max(64, 'Type de bloc invalide.'),
});

export const wordWriteSchema = z
  .object({
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
    notesBlocks: z
      .array(notesBlockSchema)
      .max(500, 'Les notes ne doivent pas depasser 500 blocs.')
      .nullable(),
    languageId: languageIdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const matches = data.tags.filter((tag) => MANDATORY_TAGS_SET.has(tag));

    if (matches.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['tags'],
        message: 'La nature du mot est obligatoire.',
      });
    }

    if (matches.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['tags'],
        message: 'Une seule nature est autorisee.',
      });
    }

    if (
      extractNotesTextFromBlocks(data.notesBlocks).length > NOTES_MAX_LENGTH
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['notesBlocks'],
        message: `Les notes ne doivent pas depasser ${NOTES_MAX_LENGTH} caracteres.`,
      });
    }
  });

export const reviewPageSearchSchema = z.object({
  lang: languageIdSchema.optional(),
  fill: z.coerce
    .number()
    .int('La taille de session doit etre un entier.')
    .refine(
      (value): value is (typeof REVIEW_BATCH_SIZES)[number] =>
        REVIEW_BATCH_SIZES.includes(
          value as (typeof REVIEW_BATCH_SIZES)[number],
        ),
      'Taille de session invalide.',
    )
    .optional(),
  sim: z.enum(['on', 'off']).optional(),
  simPanel: z.enum(['show', 'hide']).optional(),
});

export type ReviewCard = Card & {
  word: Word;
};
