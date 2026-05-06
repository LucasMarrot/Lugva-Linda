export const parseActionError = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    const message = error.message ?? fallback;
    const separatorIndex = message.indexOf(':');
    if (separatorIndex > 0) {
      return message.slice(separatorIndex + 1).trim() || fallback;
    }
    return message;
  }
  return fallback;
};

export type StatusState = {
  tone: 'success' | 'error';
  message: string;
} | null;
