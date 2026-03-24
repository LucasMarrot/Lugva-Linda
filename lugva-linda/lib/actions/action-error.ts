import { AppError } from '@/lib/errors';
import { recordActionMetric } from '@/lib/observability/metrics';

export type ActionErrorPayload = {
  code: string;
  message: string;
};

const DEFAULT_ERROR_MESSAGE = 'Une erreur inattendue est survenue.';

export const mapActionError = (error: unknown): ActionErrorPayload => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: DEFAULT_ERROR_MESSAGE,
  };
};

export const logActionError = (
  actionName: string,
  userId: string | null,
  error: unknown,
  startedAtMs?: number,
) => {
  const durationMs = startedAtMs ? Date.now() - startedAtMs : 0;
  const errorCode = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

  recordActionMetric({
    action: actionName,
    durationMs,
    success: false,
    errorCode,
    userId,
    timestamp: Date.now(),
  });

  console.error(
    JSON.stringify({
      level: 'error',
      action: actionName,
      userId,
      durationMs,
      errorCode,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { message: String(error) },
      timestamp: new Date().toISOString(),
    }),
  );
};

export const logActionSuccess = (
  actionName: string,
  userId: string | null,
  startedAtMs: number,
) => {
  const durationMs = Date.now() - startedAtMs;

  recordActionMetric({
    action: actionName,
    durationMs,
    success: true,
    userId,
    timestamp: Date.now(),
  });
};

export const toActionError = (error: unknown) => {
  const mapped = mapActionError(error);
  return new Error(`${mapped.code}:${mapped.message}`);
};
