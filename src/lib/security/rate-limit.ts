import "server-only";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const store = new Map<string, number[]>();

function now() {
  return Date.now();
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip") || "unknown";
}

function compactWindow(requests: number[], windowStart: number) {
  return requests.filter((timestamp) => timestamp >= windowStart);
}

export function checkRateLimit(request: Request, scope: string, config: RateLimitConfig): RateLimitResult {
  const timestamp = now();
  const windowStart = timestamp - config.windowMs;
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;

  const current = store.get(key) || [];
  const compacted = compactWindow(current, windowStart);

  if (compacted.length >= config.maxRequests) {
    const oldest = compacted[0] || timestamp;
    const retryAfterMs = Math.max(config.windowMs - (timestamp - oldest), 1000);
    return {
      limited: true,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
  }

  compacted.push(timestamp);
  store.set(key, compacted);

  return {
    limited: false,
    remaining: Math.max(config.maxRequests - compacted.length, 0),
    retryAfterSeconds: 0
  };
}
