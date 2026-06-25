import { rateLimit } from '@/utils/rateLimiter';
import redis from '@/lib/redis';

// Mock the Redis singleton client
jest.mock('@/lib/redis', () => {
  const multiInstance = {
    zremrangebyscore: jest.fn().mockReturnThis(),
    zadd: jest.fn().mockReturnThis(),
    zcard: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      multi: () => multiInstance,
      zrange: jest.fn().mockResolvedValue(['item1', '1719213456000']),
    },
  };
});

describe('Sliding Window Rate Limiter Tests', () => {
  let mockMulti: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMulti = redis.multi();
  });

  it('should allow requests when current window volume is below limit', async () => {
    // Mock Redis executing ZCARD command successfully returning count = 5
    mockMulti.exec.mockResolvedValue([
      [null, 1], // zremrangebyscore success status
      [null, 1], // zadd success status
      [null, 5], // zcard return value (5 requests made in window)
      [null, 1], // expire success status
    ]);

    const result = await rateLimit('test-user-key', 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.limit).toBe(10);
  });

  it('should block requests when current window count exceeds limit', async () => {
    // Mock Redis executing ZCARD returning count = 12 (limit is 10)
    mockMulti.exec.mockResolvedValue([
      [null, 1],
      [null, 1],
      [null, 12],
      [null, 1],
    ]);

    const result = await rateLimit('test-user-key', 10, 60);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
