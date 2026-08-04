import { UserRole } from '@qrgen/shared';
import { parseDurationMs, TokenService } from './token.service';

describe('parseDurationMs', () => {
  it.each([
    ['15m', 15 * 60 * 1000],
    ['30d', 30 * 24 * 60 * 60 * 1000],
    ['1h', 60 * 60 * 1000],
    ['45s', 45 * 1000],
    ['1d', 24 * 60 * 60 * 1000],
  ])('parses %p as %p ms', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it('falls back to 15 minutes for an unrecognized format', () => {
    expect(parseDurationMs('not-a-duration')).toBe(15 * 60 * 1000);
    expect(parseDurationMs('15')).toBe(15 * 60 * 1000);
    expect(parseDurationMs('15 minutes')).toBe(15 * 60 * 1000);
  });
});

describe('TokenService', () => {
  const user = { id: 'user-1', email: 'ada@example.com', role: UserRole.USER, isSuspended: false };

  function buildService() {
    const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          JWT_ACCESS_TTL: '15m',
          JWT_ACCESS_SECRET: 'test-secret',
          JWT_REFRESH_TTL_DAYS: 30,
        };
        return values[key];
      }),
    };
    const prisma = {
      session: {
        create: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn(),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new TokenService(jwt as any, config as any, prisma as any);
    return { service, jwt, config, prisma };
  }

  describe('signAccessToken', () => {
    it('signs a JWT with sub/email/role and the configured TTL', () => {
      const { service, jwt } = buildService();
      const result = service.signAccessToken(user);
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, role: user.role },
        { secret: 'test-secret', expiresIn: '15m' },
      );
      expect(result.token).toBe('signed.jwt.token');
      expect(result.ttlMs).toBe(15 * 60 * 1000);
    });
  });

  describe('issueSession', () => {
    it('persists a session hashed (not raw) refresh token', async () => {
      const { service, prisma } = buildService();
      const result = await service.issueSession(user, { userAgent: 'jest', ipAddress: '127.0.0.1' });

      expect(prisma.session.create).toHaveBeenCalledTimes(1);
      const createArgs = prisma.session.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe(user.id);
      expect(createArgs.data.refreshTokenHash).not.toBe(result.refreshToken);
      expect(createArgs.data.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex digest
    });

    it('returns a URL-safe refresh token distinct from the access token', async () => {
      const { service } = buildService();
      const result = await service.issueSession(user, {});
      expect(result.refreshToken).not.toBe(result.accessToken);
      expect(result.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('rotateSession', () => {
    it('returns null for a refresh token that is not in the database', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue(null);
      await expect(service.rotateSession('unknown-token', {})).resolves.toBeNull();
    });

    it('returns null and does not issue new tokens for a revoked session (reuse detection)', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: user.id,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100_000),
      });
      const result = await service.rotateSession('stolen-but-already-rotated-token', {});
      expect(result).toBeNull();
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('returns null for an expired session', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.rotateSession('expired-token', {})).resolves.toBeNull();
    });

    it('returns null when the owning user no longer exists', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.rotateSession('valid-token', {})).resolves.toBeNull();
    });

    it('returns null when the owning user has been suspended', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.user.findUnique.mockResolvedValue({ ...user, isSuspended: true });
      await expect(service.rotateSession('valid-token', {})).resolves.toBeNull();
    });

    it('revokes the old session and issues a new one for a valid token', async () => {
      const { service, prisma } = buildService();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.rotateSession('valid-token', { ipAddress: '10.0.0.1' });

      expect(result).not.toBeNull();
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { revokedAt: expect.any(Date) },
      });
      // A brand new session row is created for the rotated token.
      expect(prisma.session.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeSessionByRefreshToken', () => {
    it('only revokes sessions matching the token hash that are not already revoked', async () => {
      const { service, prisma } = buildService();
      await service.revokeSessionByRefreshToken('some-token');
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { refreshTokenHash: expect.any(String), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
