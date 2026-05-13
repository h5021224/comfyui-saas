type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

const defaultWindowMs = 60_000;
const defaultMaxRequests = 5;

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function checkGenerationRateLimit(identifier: string, now = Date.now()): RateLimitResult {
  const windowMs = readPositiveInt(process.env.GENERATE_RATE_LIMIT_WINDOW_MS, defaultWindowMs);
  const limit = readPositiveInt(process.env.GENERATE_RATE_LIMIT_MAX, defaultMaxRequests);
  const current = buckets.get(identifier);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(identifier, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      resetAt,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(identifier, current);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: 0,
    resetAt: current.resetAt,
  };
}
