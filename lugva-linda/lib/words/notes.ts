export const NOTES_MAX_LENGTH = 2000;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const restorePlaceholders = (value: string, placeholders: string[]) => {
  let restored = value;

  placeholders.forEach((tag, index) => {
    restored = restored.replaceAll(`__NOTES_TAG_${index}__`, tag);
  });

  return restored;
};

const normalizePlainTextToHtml = (value: string) =>
  escapeHtml(value).replace(/\n/g, '<br>');

const ALLOWED_TAGS = new Set([
  'br',
  'strong',
  'em',
  'u',
  's',
  'mark',
  'ul',
  'ol',
  'li',
  'blockquote',
  'p',
  'h1',
  'h2',
  'h3',
  'span',
]);

const STYLE_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'span']);
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

const isSafeColor = (value: string) => {
  const normalized = value.trim().toLowerCase();

  return (
    /^#[0-9a-f]{3,8}$/i.test(normalized) ||
    /^rgba?\((?:[\d\s.,%]+)\)$/i.test(normalized) ||
    /^[a-z]+$/i.test(normalized)
  );
};

const sanitizeStyle = (rawAttributes: string) => {
  const styleMatch = rawAttributes.match(/style\s*=\s*(["'])(.*?)\1/i);
  if (!styleMatch) return '';

  const declarations = styleMatch[2]
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean);

  const safeDeclarations: string[] = [];

  declarations.forEach((declaration) => {
    const separatorIndex = declaration.indexOf(':');
    if (separatorIndex === -1) return;

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = declaration.slice(separatorIndex + 1).trim();

    if (property === 'text-align') {
      const alignment = rawValue.toLowerCase();
      if (ALIGNMENTS.has(alignment)) {
        safeDeclarations.push(`text-align:${alignment}`);
      }
      return;
    }

    if (property === 'color' && isSafeColor(rawValue)) {
      safeDeclarations.push(`color:${rawValue}`);
      return;
    }

    if (property === 'background-color' && isSafeColor(rawValue)) {
      safeDeclarations.push(`background-color:${rawValue}`);
    }
  });

  if (safeDeclarations.length === 0) {
    return '';
  }

  return safeDeclarations.join(';');
};

const sanitizeTag = (
  fullMatch: string,
  slash: string,
  tagName: string,
  rawAttributes: string,
) => {
  const normalizedTag = tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(normalizedTag)) {
    return '';
  }

  if (slash) {
    return `</${normalizedTag}>`;
  }

  if (normalizedTag === 'br') {
    return '<br>';
  }

  if (!STYLE_TAGS.has(normalizedTag)) {
    return `<${normalizedTag}>`;
  }

  const safeStyle = sanitizeStyle(rawAttributes);
  if (!safeStyle) {
    return `<${normalizedTag}>`;
  }

  return `<${normalizedTag} style="${safeStyle}">`;
};

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
    .replace(/<\s*\/\s*u\s*>/gi, '</u>')
    .replace(/<\s*(?:strike|del)\b[^>]*>/gi, '<s>')
    .replace(/<\s*\/\s*(?:strike|del)\s*>/gi, '</s>')
    .replace(/<\s*s\b[^>]*>/gi, '<s>')
    .replace(/<\s*\/\s*s\s*>/gi, '</s>')
    .replace(/<\s*mark\b[^>]*>/gi, '<mark>')
    .replace(/<\s*\/\s*mark\s*>/gi, '</mark>');

  const sanitizedTags = canonicalTags.replace(
    /<(\/?)([a-z0-9]+)([^>]*)>/gi,
    sanitizeTag,
  );

  const placeholders: string[] = [];
  const withPlaceholders = sanitizedTags.replace(
    /<\/?(?:br|strong|em|u|s|mark|ul|ol|li|blockquote|p|h1|h2|h3|span)(?:\s+style="[^"]*")?\s*>/gi,
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
  decodeHtmlEntities(
    sanitizeNotesHtml(value)
      .replace(/<\s*br\s*\/?\s*>/gi, '\n')
      .replace(/<\/?(?:p|h1|h2|h3|blockquote|ul|ol|li)\b[^>]*>/gi, '\n')
      .replace(/<\/?(?:strong|em|u|s|mark|span)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
