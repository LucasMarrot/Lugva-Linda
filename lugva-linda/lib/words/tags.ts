export const MANDATORY_TAGS = [
  'Nom',
  'Verbe',
  'Adjectif',
  'Adverbe',
  'Pronom',
  'Déterminant',
  'Préposition',
  'Conjonction',
  'Interjection',
  'Expression',
  'Phrase',
] as const;

export type MandatoryTag = (typeof MANDATORY_TAGS)[number];

export const MANDATORY_TAGS_SET = new Set<string>(MANDATORY_TAGS);
