// Simple two-tier cache: in-memory (always) + Upstash Redis (if configured).
// Upstream APIs are rate-limited (OpenF1 ~3 req/s) and Jolpica updates ~weekly,
// so every API route should go through `cached()` with a TTL by data type.

type CacheEntry = { value: unknown; expiresAt: number };
const memory = new Map<string, CacheEntry>();

function getMemory<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

function setMemory(key: string, value: unknown, ttlSeconds: number) {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  // Bound memory growth for long-running dev servers.
  if (memory.size > 1000) {
    const oldest = memory.keys().next().value;
    if (oldest) memory.delete(oldest);
  }
}

async function getRedis<T>(key: string): Promise<T | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

async function setRedis(key: string, value: unknown, ttlSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Redis is best-effort; memory cache still applies.
  }
}

export const TTL = {
  live: 5, // live timing proxy
  weekend: 300, // 5 min during a race weekend
  season: 3600, // current-season standings/results
  history: 86400, // historical seasons
} as const;

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const mem = getMemory<T>(key);
  if (mem !== null) return mem;
  const remote = await getRedis<T>(key);
  if (remote !== null) {
    setMemory(key, remote, Math.min(ttlSeconds, 60));
    return remote;
  }
  const fresh = await fetcher();
  setMemory(key, fresh, ttlSeconds);
  await setRedis(key, fresh, ttlSeconds);
  return fresh;
}
