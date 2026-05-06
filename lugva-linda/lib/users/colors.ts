export const USER_COLOR_OPTIONS = [
  '#3B82F6',
  '#4F46E5',
  '#7C3AED',
  '#9333EA',
  '#0D9488',
  '#16A34A',
  '#D97706',
  '#EA580C',
  '#DC2626',
  '#E11D48',
] as const;

export type UserColorOption = (typeof USER_COLOR_OPTIONS)[number];
