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
  '#854D0E', // Bronze / Moutarde foncé (L'alternative au jaune)
  '#5D4037', // Marron Mocha
  '#0F6C80', // Bleu Pétrole (L'alternative au vert d'eau)
  '#4D7C0F', // Vert Olive
  '#1E3A8A', // Bleu Nuit
  '#4C1D95', // Violet Impérial
  '#701A75', // Prune / Aubergine
  '#831843', // Cassis
  '#3F3F46', // Gris Carbone
  '#0F172A', // Encre / Slate ultra-profond
  '#1B1B1B', // Noir profond
] as const;

// export const USER_COLOR_OPTIONS = [
//   '#854D0E', // Bronze / Moutarde foncé (L'alternative au jaune)
//   '#5D4037', // Marron Mocha
//   '#0F6C80', // Bleu Pétrole (L'alternative au vert d'eau)
//   '#4D7C0F', // Vert Olive
//   '#1E3A8A', // Bleu Nuit
//   '#4C1D95', // Violet Impérial
//   '#701A75', // Prune / Aubergine
//   '#831843', // Cassis
//   '#3F3F46', // Gris Carbone
//   '#0F172A', // Encre / Slate ultra-profond
// ] as const;

export type UserColorOption = (typeof USER_COLOR_OPTIONS)[number];
