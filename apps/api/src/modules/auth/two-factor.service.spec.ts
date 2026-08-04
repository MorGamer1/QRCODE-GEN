import { authenticator } from 'otplib';
import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService', () => {
  function buildService() {
    const config = { get: jest.fn().mockReturnValue('QR Code Generator') };
    const prisma = {
      twoFactorRecoveryCode: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 10 }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new TwoFactorService(config as any, prisma as any);
    return { service, config, prisma };
  }

  describe('generateSecret', () => {
    it('produces a base32 secret usable by otplib', () => {
      const { service } = buildService();
      const secret = service.generateSecret();
      expect(secret).toMatch(/^[A-Z2-7]+$/);
      // Round-trips through otplib itself without throwing.
      expect(() => authenticator.generate(secret)).not.toThrow();
    });

    it('produces a different secret on each call', () => {
      const { service } = buildService();
      expect(service.generateSecret()).not.toBe(service.generateSecret());
    });
  });

  describe('verifyToken', () => {
    it('accepts the current valid TOTP code for a secret', () => {
      const { service } = buildService();
      const secret = authenticator.generateSecret();
      const validToken = authenticator.generate(secret);
      expect(service.verifyToken(validToken, secret)).toBe(true);
    });

    it('rejects an incorrect 6-digit code', () => {
      const { service } = buildService();
      const secret = authenticator.generateSecret();
      const realToken = authenticator.generate(secret);
      // Flip the token so it's guaranteed wrong regardless of the real value.
      const wrongToken = realToken === '000000' ? '111111' : '000000';
      expect(service.verifyToken(wrongToken, secret)).toBe(false);
    });

    it('returns false (never throws) for a malformed token', () => {
      const { service } = buildService();
      const secret = authenticator.generateSecret();
      expect(service.verifyToken('not-a-code', secret)).toBe(false);
      expect(service.verifyToken('', secret)).toBe(false);
    });
  });

  describe('buildSetupQrSvg', () => {
    it('renders an <svg> containing the otpauth setup', () => {
      const { service } = buildService();
      const svg = service.buildSetupQrSvg('ada@example.com', authenticator.generateSecret());
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
  });

  describe('generateRecoveryCodes', () => {
    it('generates 10 unique, dash-formatted codes and stores only their hashes', async () => {
      const { service, prisma } = buildService();
      const codes = await service.generateRecoveryCodes('user-1');

      expect(codes).toHaveLength(10);
      expect(new Set(codes).size).toBe(10);
      for (const code of codes) {
        expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
      }

      expect(prisma.twoFactorRecoveryCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      const createArgs = prisma.twoFactorRecoveryCode.createMany.mock.calls[0][0];
      expect(createArgs.data).toHaveLength(10);
      for (const row of createArgs.data) {
        expect(row.userId).toBe('user-1');
        expect(codes).not.toContain(row.codeHash); // never stores the plaintext code
        expect(row.codeHash).toMatch(/^[a-f0-9]{64}$/);
      }
    });
  });

  describe('consumeRecoveryCode', () => {
    it('returns false when no matching unused code exists', async () => {
      const { service, prisma } = buildService();
      prisma.twoFactorRecoveryCode.findFirst.mockResolvedValue(null);
      await expect(service.consumeRecoveryCode('user-1', 'AAAAA-BBBBB')).resolves.toBe(false);
      expect(prisma.twoFactorRecoveryCode.update).not.toHaveBeenCalled();
    });

    it('marks the code used and returns true on a match, normalizing case/whitespace', async () => {
      const { service, prisma } = buildService();
      prisma.twoFactorRecoveryCode.findFirst.mockResolvedValue({ id: 'code-1' });

      await expect(service.consumeRecoveryCode('user-1', '  aaaaa-bbbbb  ')).resolves.toBe(true);

      expect(prisma.twoFactorRecoveryCode.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', codeHash: expect.any(String), usedAt: null },
      });
      expect(prisma.twoFactorRecoveryCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { usedAt: expect.any(Date) },
      });
    });
  });
});
