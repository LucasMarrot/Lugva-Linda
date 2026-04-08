import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function frenchPluralize(
  count: number,
  singular: string,
  plural?: string,
) {
  return count <= 1 ? singular : plural ? plural : `${singular}s`;
}

export const toTint = (hex: string) => `${hex}1A`;

export const toUpperCaseFirstWord = (str: string) =>
  str.charAt(0).toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
