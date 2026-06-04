export const DEFAULT_USER_COLOR = '#1B1B1B';

export const USER_COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#9333EA', // Purple
  '#0D9488', // Teal
  '#16A34A', // Green
  '#D97706', // Amber
  '#EA580C', // Orange
  '#DC2626', // Red
  '#E11D48', // Rose
  '#854D0E', // Bronze / Moutarde foncé
  '#5D4037', // Marron Mocha
  '#0F6C80', // Bleu Pétrole
  '#4D7C0F', // Vert Olive
  '#1E3A8A', // Bleu Nuit
  '#4C1D95', // Violet Impérial
  '#701A75', // Prune / Aubergine
  '#831843', // Cassis
  '#3F3F46', // Gris Carbone
  '#0F172A', // Encre / Slate ultra-profond
  '#1B1B1B', // Noir profond
] as const;

export type UserColorOption = (typeof USER_COLOR_OPTIONS)[number];

export const USER_COLOR_THEMES: Record<string, string> = {
  '#3B82F6': '#60A5FA', // Blue 500 -> Blue 400
  '#4F46E5': '#818CF8', // Indigo 600 -> Indigo 400
  '#7C3AED': '#A78BFA', // Violet 600 -> Violet 400
  '#9333EA': '#C084FC', // Purple 600 -> Purple 400
  '#0D9488': '#2DD4BF', // Teal 600 -> Teal 400
  '#16A34A': '#4ADE80', // Green 600 -> Green 400
  '#D97706': '#FBBF24', // Amber 600 -> Amber 400
  '#EA580C': '#FB923C', // Orange 600 -> Orange 400
  '#DC2626': '#F87171', // Red 600 -> Red 400
  '#E11D48': '#FB7185', // Rose 600 -> Rose 400
  '#854D0E': '#CA8A04', // Bronze -> Yellow 600
  '#5D4037': '#A1887F', // Mocha -> Brown 400
  '#0F6C80': '#4DB6AC', // Bleu Pétrole -> Teal 300
  '#4D7C0F': '#A3E635', // Vert Olive -> Lime 400
  '#1E3A8A': '#93C5FD', // Bleu Nuit -> Blue 300
  '#4C1D95': '#C4B5FD', // Violet Impérial -> Violet 300
  '#701A75': '#F0ABFC', // Prune -> Fuchsia 300
  '#831843': '#F9A8D4', // Cassis -> Pink 300
  '#3F3F46': '#A1A1AA', // Gris Carbone -> Zinc 400
  '#0F172A': '#94A3B8', // Encre -> Slate 400
  '#1B1B1B': '#F5F5F5', // Noir profond -> Blanc cassé
};

export const getThemeColor = (baseColor?: string, theme?: string) => {
  if (!baseColor) return undefined;

  if (theme === 'dark') {
    return USER_COLOR_THEMES[baseColor] || baseColor;
  }
  return baseColor;
};
