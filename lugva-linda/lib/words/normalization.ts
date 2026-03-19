export const normalizeText = (value: string) => value.normalize('NFC').trim();

export const normalizeForLookup = (value: string) =>
  normalizeText(value).toLowerCase();

export const normalizeStringArray = (values: string[]) => {
  const deduped = new Set<string>();

  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized.length > 0) {
      deduped.add(normalized);
    }
  }

  return Array.from(deduped);
};

export const normalizeFormStringArray = (values: FormDataEntryValue[]) => {
  const onlyStrings = values.filter(
    (value): value is string => typeof value === 'string',
  );

  return normalizeStringArray(onlyStrings);
};
