import type Redis from 'ioredis';
import { consumeRequestLimit } from 'src/config/request-security';

describe('Request rate limits', () => {
  it('should stop waiting if a Redis command never settles', async () => {
    jest.useFakeTimers();
    try {
      const redis = {
        eval: jest.fn().mockReturnValue(new Promise(() => {})),
      } as unknown as Redis;
      const assertion = expect(
        consumeRequestLimit(redis, 'limit:test', 5, 60000),
      ).rejects.toThrow('Protection temporairement indisponible.');
      await jest.advanceTimersByTimeAsync(1500);
      await assertion;
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
  it('should accept the last request within the limit', async () => {
    const evalMock = jest.fn().mockResolvedValue([5, 60000]);
    await expect(
      consumeRequestLimit(
        { eval: evalMock } as unknown as Redis,
        'limit:test',
        5,
        60000,
      ),
    ).resolves.toBe(0);
    expect(evalMock).toHaveBeenCalledWith(
      expect.stringContaining('PEXPIRE'),
      1,
      'limit:test',
      60000,
    );
  });
  it('should return the rounded remaining window after the limit', async () => {
    const redis = {
      eval: jest.fn().mockResolvedValue([6, 1501]),
    } as unknown as Redis;
    await expect(
      consumeRequestLimit(redis, 'limit:test', 5, 60000),
    ).resolves.toBe(2);
  });
  it('should reject requests if the shared limiter is unavailable', async () => {
    const error = new Error('Redis unavailable');
    const redis = {
      eval: jest.fn().mockRejectedValue(error),
    } as unknown as Redis;
    await expect(
      consumeRequestLimit(redis, 'limit:test', 5, 60000),
    ).rejects.toBe(error);
  });
});
