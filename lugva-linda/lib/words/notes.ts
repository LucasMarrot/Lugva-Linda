import { ValidationError } from '@/lib/errors';

export const NOTES_MAX_LENGTH = 2000;

type JsonRecord = Record<string, unknown>;

export type NotesBlock = JsonRecord & {
  id: string;
  type: string;
  children?: NotesBlock[];
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const buildNotesBlock = (value: unknown): NotesBlock | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    typeof value.id === 'string' && value.id.trim().length > 0
      ? value.id
      : `block-${crypto.randomUUID()}`;
  const type =
    typeof value.type === 'string' && value.type.trim().length > 0
      ? value.type
      : 'paragraph';

  const normalizedChildren = Array.isArray(value.children)
    ? value.children
        .map((child) => buildNotesBlock(child))
        .filter((child): child is NotesBlock => child !== null)
    : undefined;

  return {
    ...value,
    id,
    type,
    ...(normalizedChildren ? { children: normalizedChildren } : {}),
  };
};

export const normalizeNotesBlocks = (value: unknown): NotesBlock[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((block) => buildNotesBlock(block))
    .filter((block): block is NotesBlock => block !== null);

  return normalized.length > 0 ? normalized : null;
};

export const parseNotesBlocks = (value: string): NotesBlock[] | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new ValidationError(
      'Le format des blocs de notes est invalide.',
      'INVALID_NOTES_BLOCKS',
    );
  }

  const blocks = normalizeNotesBlocks(parsed);
  if (!blocks) {
    throw new ValidationError(
      'Le format des blocs de notes est invalide.',
      'INVALID_NOTES_BLOCKS',
    );
  }

  return blocks;
};

export const serializeNotesBlocks = (value: NotesBlock[] | null | undefined) =>
  value && value.length > 0 ? JSON.stringify(value) : '';

const collectTextTokens = (value: unknown, output: string[]) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTextTokens(item, output));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, current]) => {
    if (key === 'text' && typeof current === 'string') {
      const trimmed = current.trim();
      if (trimmed) {
        output.push(trimmed);
      }
      return;
    }

    if (key === 'content' || key === 'children') {
      collectTextTokens(current, output);
    }
  });
};

export const extractNotesTextFromBlocks = (
  value: NotesBlock[] | null | undefined,
) => {
  if (!value || value.length === 0) {
    return '';
  }

  const tokens: string[] = [];
  collectTextTokens(value, tokens);

  return tokens
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const normalizeNotesBlocksForPersistence = (
  value: unknown,
): NotesBlock[] | null => {
  const normalized = normalizeNotesBlocks(value);
  if (!normalized) {
    return null;
  }

  return extractNotesTextFromBlocks(normalized).length > 0 ? normalized : null;
};
