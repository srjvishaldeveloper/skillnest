// Redis client with graceful fallback
// If REDIS_URL is not set, all operations become no-ops
import Redis from "ioredis";

let redis: Redis | null = null;

function getClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry on failure
      lazyConnect: true,
    });
    redis.on("error", () => {
      redis = null; // disconnect on error, will reconnect on next call
    });
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const client = getClient();
    if (!client) return null;
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number = 60): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;
    await client.set(key, value, "EX", ttlSeconds);
  } catch {
    // silent fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;
    await client.del(key);
  } catch {
    // silent fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // silent fail
  }
}
