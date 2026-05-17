import { Rating } from 'ts-fsrs';
import { ValidGrade } from '@/lib/validation/schemas';

export type GradeUI = {
  label: string;
  variant: 'default' | 'valid' | 'destructive' | 'info' | 'warning';
};

export const normalizeWord = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

export const getGradeUI = (grade: ValidGrade): GradeUI => {
  switch (grade) {
    case Rating.Easy:
      return { label: 'Facile', variant: 'valid' };
    case Rating.Good:
      return { label: 'Bon', variant: 'info' };
    case Rating.Hard:
      return { label: 'Difficile', variant: 'warning' };
    case Rating.Again:
      return { label: 'Oublié', variant: 'destructive' };
    default:
      return { label: '', variant: 'default' };
  }
};

export const getSubtleStyles = (attemptCount: number, fast: boolean) => {
  if (attemptCount === 0)
    return fast
      ? 'bg-emerald-700/5 border-emerald-700/40 shadow-[inset_0_0_60px_rgba(16,185,129,0.2),0_8px_30px_rgba(16,185,129,0.15)]'
      : 'bg-blue-500/5 border-blue-500/40 shadow-[inset_0_0_60px_rgba(59,130,246,0.2),0_8px_30px_rgba(59,130,246,0.15)]';
  if (attemptCount === 1 || attemptCount === 2)
    return 'bg-orange-500/5 border-orange-500/40 shadow-[inset_0_0_60px_rgba(249,115,22,0.2),0_8px_30px_rgba(249,115,22,0.15)]';
  return 'bg-destructive/5 border-destructive/50 shadow-[inset_0_0_60px_rgba(239,68,68,0.2),0_8px_30px_rgba(239,68,68,0.15)]';
};
