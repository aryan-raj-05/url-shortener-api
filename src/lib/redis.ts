import { z } from "zod";
import { createClient } from "redis";
import { config } from "./config.js";

export const redis = createClient({
  url: config.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function deleteCached(key: string): Promise<void> {
  await redis.del(key);
}

export async function getCached<T>(
  key: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const value = await redis.get(key);

  if (value === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return schema.parse(parsed);
  } catch {
    // Invalid JSON or invalid data: discard the cache entry.
    await redis.del(key);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  schema: z.ZodType<T>,
  ttlSeconds = 300,
): Promise<void> {
  const validated = schema.parse(value);

  await redis.set(key, JSON.stringify(validated), {
    expiration: {
      type: "EX",
      value: ttlSeconds,
    },
  });
}
