import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

declare global {
  var redisGlobal: undefined | Redis;
}

/**
 * Lazy-loaded Redis client using an ES6 Proxy.
 * Prevents active socket connections during Next.js build/compilation phases,
 * avoiding build-time ECONNREFUSED crashes when Redis is not running locally.
 */
const redisProxy = new Proxy({} as Redis, {
  get(target, prop) {
    if (!globalThis.redisGlobal) {
      globalThis.redisGlobal = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        lazyConnect: true,          // Do not connect immediately on instantiation
      });
    }
    
    const value = (globalThis.redisGlobal as any)[prop];
    if (typeof value === 'function') {
      return value.bind(globalThis.redisGlobal);
    }
    return value;
  },
});

export default redisProxy;
