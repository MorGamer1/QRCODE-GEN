import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  function buildContext(opts: {
    type?: string;
    request?: Record<string, unknown>;
  } = {}): ExecutionContext {
    const request = opts.request ?? { ip: '127.0.0.1' };
    return {
      getType: () => opts.type ?? 'http',
      getHandler: () => function exampleHandler() {},
      getClass: () => class ExampleController {},
      switchToHttp: () => ({ getRequest: () => request }),
      // Unused by the guard, present only to satisfy the ExecutionContext shape.
      switchToRpc: () => ({}) as never,
      switchToWs: () => ({}) as never,
      getArgs: () => [] as never,
      getArgByIndex: () => undefined as never,
    } as unknown as ExecutionContext;
  }

  function buildGuard(overrides: { skip?: boolean; options?: { limit: number; ttlSeconds: number } } = {}) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === 'skip_rate_limit') return overrides.skip;
        if (key === 'rate_limit') return overrides.options;
        return undefined;
      }),
    };
    const redis = { incrWithExpiry: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guard = new RateLimitGuard(reflector as any, redis as any);
    return { guard, reflector, redis };
  }

  it('always allows non-HTTP contexts (e.g. queue processors) through untouched', async () => {
    const { guard, redis } = buildGuard();
    await expect(guard.canActivate(buildContext({ type: 'rpc' }))).resolves.toBe(true);
    expect(redis.incrWithExpiry).not.toHaveBeenCalled();
  });

  it('allows the request through when @SkipRateLimit() is set, without touching Redis', async () => {
    const { guard, redis } = buildGuard({ skip: true });
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
    expect(redis.incrWithExpiry).not.toHaveBeenCalled();
  });

  it('allows the request through while under the limit', async () => {
    const { guard, redis } = buildGuard({ options: { limit: 5, ttlSeconds: 60 } });
    redis.incrWithExpiry.mockResolvedValue(3);
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('throws 429 once the count exceeds the limit', async () => {
    const { guard, redis } = buildGuard({ options: { limit: 5, ttlSeconds: 60 } });
    redis.incrWithExpiry.mockResolvedValue(6);
    await expect(guard.canActivate(buildContext())).rejects.toThrow(HttpException);
  });

  it('allows the request through exactly at the limit boundary', async () => {
    const { guard, redis } = buildGuard({ options: { limit: 5, ttlSeconds: 60 } });
    redis.incrWithExpiry.mockResolvedValue(5);
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('keys by authenticated user id rather than IP when both are present', async () => {
    const { guard, redis } = buildGuard({ options: { limit: 5, ttlSeconds: 60 } });
    redis.incrWithExpiry.mockResolvedValue(1);
    await guard.canActivate(buildContext({ request: { ip: '127.0.0.1', user: { id: 'user-42' } } }));
    const [key] = redis.incrWithExpiry.mock.calls[0];
    expect(key).toContain('user-42');
    expect(key).not.toContain('127.0.0.1');
  });

  it('falls back to IP, then "anonymous", when there is no authenticated user', async () => {
    const { guard, redis } = buildGuard({ options: { limit: 5, ttlSeconds: 60 } });
    redis.incrWithExpiry.mockResolvedValue(1);

    await guard.canActivate(buildContext({ request: { ip: '203.0.113.7' } }));
    expect(redis.incrWithExpiry.mock.calls[0][0]).toContain('203.0.113.7');

    await guard.canActivate(buildContext({ request: {} }));
    expect(redis.incrWithExpiry.mock.calls[1][0]).toContain('anonymous');
  });
});
