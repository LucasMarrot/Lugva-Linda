export const NOTES_MAX_LENGTH = 2000;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const restorePlaceholders = (value: string, placeholders: string[]) => {
  let restored = value;

  placeholders.forEach((tag, index) => {
    restored = restored.replaceAll(`__NOTES_TAG_${index}__`, tag);
  });

  return restored;
};

const normalizePlainTextToHtml = (value: string) =>
  escapeHtml(value).replace(/\n/g, '<br>');

export const sanitizeNotesHtml = (value: string) => {
  const normalized = value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';

  const hasHtmlTag = /<[^>]+>/.test(normalized);
  const base = hasHtmlTag ? normalized : normalizePlainTextToHtml(normalized);

  const withoutScripts = base.replace(
    /<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    '',
  );

  const canonicalTags = withoutScripts
    .replace(/<\s*br\b[^>]*\/?\s*>/gi, '<br>')
    .replace(/<\s*b\b[^>]*>/gi, '<strong>')
    .replace(/<\s*\/\s*b\s*>/gi, '</strong>')
    .replace(/<\s*strong\b[^>]*>/gi, '<strong>')
    .replace(/<\s*\/\s*strong\s*>/gi, '</strong>')
    .replace(/<\s*i\b[^>]*>/gi, '<em>')
    .replace(/<\s*\/\s*i\s*>/gi, '</em>')
    .replace(/<\s*em\b[^>]*>/gi, '<em>')
    .replace(/<\s*\/\s*em\s*>/gi, '</em>')
    .replace(/<\s*u\b[^>]*>/gi, '<u>')
    .replace(/<\s*\/\s*u\s*>/gi, '</u>');

  const placeholders: string[] = [];
  const withPlaceholders = canonicalTags.replace(
    /<br>|<strong>|<\/strong>|<em>|<\/em>|<u>|<\/u>/gi,
    (tag) => {
      const key = `__NOTES_TAG_${placeholders.length}__`;
      placeholders.push(tag.toLowerCase());
      return key;
    },
  );

  const escaped = escapeHtml(withPlaceholders);
  const restored = restorePlaceholders(escaped, placeholders)
    .replace(/(<br>){3,}/g, '<br><br>')
    .replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, '');

  return restored;
};

export const extractNotesText = (value: string) =>
  sanitizeNotesHtml(value)
    .replace(/<br>/gi, '\n')
    .replace(/<\/?(?:strong|em|u)>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
