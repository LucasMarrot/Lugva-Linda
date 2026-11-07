export type NavigationDirection = 'prev' | 'next';

/**
 * Identifiant d'une entrée de navigation.
 * Un mot et ses synonymes partagent le même `id` : le terme d'affichage
 * est donc nécessaire pour distinguer chaque fiche de la liste.
 */
export const getEntryKey = (entry: { id: string; term: string }): string =>
  `${entry.id}::${entry.term}`;

/**
 * Seules les fiches détaillées sont navigables : un mot "À compléter"
 * ouvre la modale de complétion et n'a pas de fiche de détail.
 */
export const getNavigableEntries = <T extends { status?: string }>(
  list: readonly T[],
): T[] => list.filter((entry) => entry.status !== 'TO_COMPLETE');

/** Position de l'entrée dans la liste (ordre affiché), ou -1 si absente. */
export const findEntryIndex = <T extends { id: string; term: string }>(
  list: readonly T[],
  entry: { id: string; term: string },
): number => {
  const key = getEntryKey(entry);
  return list.findIndex((item) => getEntryKey(item) === key);
};

/**
 * Index de l'entrée voisine, avec bouclage en bout de liste.
 * Retourne null s'il n'y a pas de navigation possible.
 */
export const getAdjacentIndex = (
  length: number,
  currentIndex: number,
  direction: NavigationDirection,
): number | null => {
  if (length <= 1 || currentIndex < 0 || currentIndex >= length) {
    return null;
  }

  return direction === 'next'
    ? (currentIndex + 1) % length
    : (currentIndex - 1 + length) % length;
};
