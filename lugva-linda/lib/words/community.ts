import type { Word } from '@prisma/client';

export type WordOwnerSummary = {
  id: string;
  email: string;
  colorHex: string;
  displayName: string;
};

export type WordCommunityView = Word & {
  owner: WordOwnerSummary;
  isOwnedByCurrentUser: boolean;
};

export type CommunityMemberSummary = {
  id: string;
  email: string;
  colorHex: string;
  displayName: string;
};

export type CopyFieldOptions = {
  translation: boolean;
  tags: boolean;
  notes: boolean;
  synonyms: boolean;
  audio: boolean;
};

export const defaultCopyFieldOptions: CopyFieldOptions = {
  translation: true,
  tags: true,
  notes: false,
  synonyms: false,
  audio: false,
};

export type MergeMode = 'keep' | 'replace' | 'merge';

export type WordMergeStrategy = {
  translation: Exclude<MergeMode, 'merge'>;
  tags: MergeMode;
  notes: MergeMode;
  synonyms: MergeMode;
  audio: Exclude<MergeMode, 'merge'>;
};

export const defaultWordMergeStrategy: WordMergeStrategy = {
  translation: 'keep',
  tags: 'merge',
  notes: 'merge',
  synonyms: 'merge',
  audio: 'keep',
};

export const toDisplayName = (
  email: string,
  userId: string,
  username?: string | null,
) => {
  const normalizedUsername = username?.trim();
  if (normalizedUsername && normalizedUsername.length > 0) {
    return normalizedUsername;
  }

  const localPart = email.split('@')[0]?.trim();
  if (localPart && localPart.length > 0) {
    return localPart;
  }

  return `membre-${userId.slice(0, 6)}`;
};
