import { sanitizeQr } from './qr-codes.service';

describe('sanitizeQr', () => {
  // Regression test: every QR read path (create, list, get-one, and all update endpoints) used
  // to return the raw Prisma row straight to the client, including `passwordHash` - the
  // argon2 hash of the redirect-gate password. See this function's own doc comment.
  it('strips passwordHash from the returned object', () => {
    const qr = { id: 'qr-1', name: 'Test', passwordHash: '$argon2id$v=19$...' };
    const result = sanitizeQr(qr);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('exposes hasPassword: true when a password hash was set', () => {
    const result = sanitizeQr({ id: 'qr-1', passwordHash: '$argon2id$v=19$...' });
    expect(result.hasPassword).toBe(true);
  });

  it('exposes hasPassword: false when passwordHash is null', () => {
    const result = sanitizeQr({ id: 'qr-1', passwordHash: null });
    expect(result.hasPassword).toBe(false);
  });

  it('preserves every other field unchanged', () => {
    const qr = {
      id: 'qr-1',
      name: 'Test',
      shortCode: 'AbC1234',
      passwordHash: null,
      tags: ['a', 'b'],
    };
    const result = sanitizeQr(qr);
    expect(result).toMatchObject({
      id: 'qr-1',
      name: 'Test',
      shortCode: 'AbC1234',
      tags: ['a', 'b'],
    });
  });
});
