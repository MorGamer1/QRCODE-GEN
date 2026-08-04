import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  describe('hash / verify', () => {
    it('produces an argon2id hash', async () => {
      const hash = await service.hash('correct horse battery staple');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('verifies a matching plaintext against its hash', async () => {
      const hash = await service.hash('correct horse battery staple');
      await expect(service.verify(hash, 'correct horse battery staple')).resolves.toBe(true);
    });

    it('rejects a non-matching plaintext', async () => {
      const hash = await service.hash('correct horse battery staple');
      await expect(service.verify(hash, 'wrong password')).resolves.toBe(false);
    });

    it('produces different hashes for the same input (random salt)', async () => {
      const [a, b] = await Promise.all([
        service.hash('same password'),
        service.hash('same password'),
      ]);
      expect(a).not.toBe(b);
    });

    it('verify() resolves false instead of throwing on a malformed hash', async () => {
      await expect(service.verify('not-a-real-argon2-hash', 'anything')).resolves.toBe(false);
    });

    it('verify() resolves false for an empty hash', async () => {
      await expect(service.verify('', 'anything')).resolves.toBe(false);
    });
  });

  describe('generateToken', () => {
    it('produces a URL-safe token with no padding characters', () => {
      const token = service.generateToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });

    it('produces a different token on every call', () => {
      const tokens = new Set(Array.from({ length: 20 }, () => service.generateToken()));
      expect(tokens.size).toBe(20);
    });
  });
});
