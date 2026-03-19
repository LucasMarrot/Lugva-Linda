import type { Word } from '@prisma/client';

export const canReadWord = (
  word: Pick<Word, 'languageId'>,
  languageId: string,
) => word.languageId === languageId;

export const canEditWord = (word: Pick<Word, 'ownerId'>, userId: string) =>
  word.ownerId === userId;

export const canDeleteWord = (word: Pick<Word, 'ownerId'>, userId: string) =>
  word.ownerId === userId;
