import { ValidationError } from '@/lib/errors';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: RateLimitStore;
};

const getStore = (): RateLimitStore => {
  if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map<string, RateLimitBucket>();
  }

  return globalForRateLimit.__rateLimitStore;
};

export const assertRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number,
) => {
  const now = Date.now();
  const store = getStore();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (bucket.count >= maxRequests) {
    throw new ValidationError(
      'Trop de requetes. Reessayez plus tard.',
      'RATE_LIMITED',
    );
  }

  bucket.count += 1;
  store.set(key, bucket);
};
