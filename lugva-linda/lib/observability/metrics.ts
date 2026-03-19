type ActionMetric = {
  action: string;
  durationMs: number;
  success: boolean;
  errorCode?: string;
  userId: string | null;
  timestamp: number;
};

type MetricsStore = {
  events: ActionMetric[];
};

const MAX_EVENTS = 1000;
const WINDOW_MS = 1000 * 60 * 10;

const globalForMetrics = globalThis as typeof globalThis & {
  __backendMetricsStore?: MetricsStore;
};

const getStore = (): MetricsStore => {
  if (!globalForMetrics.__backendMetricsStore) {
    globalForMetrics.__backendMetricsStore = {
      events: [],
    };
  }

  return globalForMetrics.__backendMetricsStore;
};

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(index, 0)];
};

export const recordActionMetric = (metric: ActionMetric) => {
  const store = getStore();
  store.events.push(metric);

  if (store.events.length > MAX_EVENTS) {
    store.events.splice(0, store.events.length - MAX_EVENTS);
  }
};

export const getMetricsSnapshot = () => {
  const store = getStore();
  const now = Date.now();
  const recentEvents = store.events.filter(
    (event) => now - event.timestamp <= WINDOW_MS,
  );

  return {
    totalRecentEvents: recentEvents.length,
    recentErrors: recentEvents.filter((event) => !event.success).length,
    recentStorageErrors: recentEvents.filter(
      (event) => event.errorCode === 'STORAGE_ERROR',
    ).length,
    p95LatencyMs: percentile(
      recentEvents.map((event) => event.durationMs),
      95,
    ),
  };
};
