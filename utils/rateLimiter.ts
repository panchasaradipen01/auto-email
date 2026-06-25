import redis from '@/lib/redis';

interface RateLimiterResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Sliding window rate limiter utilizing Redis sorted sets (ZSET).
 * @param key Unique identifier (e.g. userId or IP)
 * @param limit Max number of requests allowed in the window
 * @param windowSeconds Window size in seconds (default: 60)
 */
export async function rateLimit(
  key: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimiterResult> {
  const now = Date.now();
  const clearBefore = now - windowSeconds * 1000;
  const redisKey = `ratelimit:${key}`;

  // Multi-exec pipeline to ensure atomicity
  const transaction = redis.multi();
  
  // Clean up old requests outside current window
  transaction.zremrangebyscore(redisKey, 0, clearBefore);
  // Add current request score/value
  transaction.zadd(redisKey, now, `${now}-${Math.random()}`);
  // Count total items remaining in the window
  transaction.zcard(redisKey);
  // Set TTL slightly larger than window size to cleanup inactive keys
  transaction.expire(redisKey, windowSeconds + 10);

  const results = await transaction.exec();
  if (!results) {
    throw new Error('Redis rate limiter transaction execution failed');
  }

  // results[2] corresponds to the ZCARD command response
  // ioredis responses are in the format [error, response]
  const cardResult = results[2];
  if (cardResult[0]) {
    throw cardResult[0];
  }
  
  const requestCount = cardResult[1] as number;
  const allowed = requestCount <= limit;
  const remaining = Math.max(0, limit - requestCount);

  // Reset time is when the oldest transaction falls outside the sliding window
  const oldestRecord = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
  let resetTime = now + windowSeconds * 1000;
  if (oldestRecord.length > 0) {
    const oldestTimestamp = parseFloat(oldestRecord[1]);
    resetTime = oldestTimestamp + windowSeconds * 1000;
  }

  return {
    allowed,
    limit,
    remaining,
    reset: Math.ceil(resetTime / 1000),
  };
}
