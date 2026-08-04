import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { cleanDatabase, createTestApp } from './utils/test-app';

describe('Redirect engine (e2e)', () => {
  let app: NestExpressApplication;
  let server: Parameters<typeof request>[0];
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'CorrectHorse123' })
      .expect(201);
    accessToken = res.body.accessToken;
  });

  afterEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createDynamicQr(overrides: Record<string, unknown> = {}) {
    const res = await request(server)
      .post('/api/v1/qr-codes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'DYNAMIC',
        name: 'Dynamic link',
        content: { contentType: 'URL', data: { url: 'https://example.com/landing' } },
        ...overrides,
      })
      .expect(201);
    return res.body;
  }

  it('returns 404 with a friendly page for an unknown short code', async () => {
    const res = await request(server).get('/api/r/doesnotexist').expect(404);
    expect(res.text).toContain('does not exist');
  });

  it('redirects an instant-redirect content type (URL) straight to the target, no auth required', async () => {
    const qr = await createDynamicQr();

    const res = await request(server).get(`/api/r/${qr.shortCode}`).expect(302);
    expect(res.headers.location).toBe('https://example.com/landing');
  });

  it('honors a custom redirect statusCode (301)', async () => {
    const created = await createDynamicQr();
    await request(server)
      .put(`/api/v1/qr-codes/${created.id}/redirect-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ statusCode: 301 })
      .expect(200);

    const res = await request(server).get(`/api/r/${created.shortCode}`).expect(301);
    expect(res.headers.location).toBe('https://example.com/landing');
  });

  it('serves a password prompt instead of redirecting when the QR is password-protected', async () => {
    const created = await createDynamicQr();
    await request(server)
      .put(`/api/v1/qr-codes/${created.id}/redirect-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'letmein123' })
      .expect(200);

    const res = await request(server).get(`/api/r/${created.shortCode}`).expect(200);
    expect(res.text.toLowerCase()).toContain('password');
    expect(res.headers.location).toBeUndefined();
  });

  it('unlocks and redirects after submitting the correct password', async () => {
    const created = await createDynamicQr();
    await request(server)
      .put(`/api/v1/qr-codes/${created.id}/redirect-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'letmein123' })
      .expect(200);

    const unlockRes = await request(server)
      .post(`/api/r/${created.shortCode}/unlock`)
      .send({ password: 'letmein123' })
      .expect(302);

    // The unlock cookie is set with Path=/r, scoped to the public short-URL path that nginx
    // exposes in production (it internally rewrites /r/* -> /api/r/* without the browser ever
    // seeing /api - see infra/docker/nginx/conf.d/default.conf). Hitting the backend directly
    // here means that path never matches this suite's /api/r/* requests, so a real cookie jar
    // would (correctly) never attach it - forward it manually to test the unlock logic itself
    // in isolation from nginx's rewrite, which isn't running in this test.
    const setCookieHeader = (unlockRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith(`qr_unlock_${created.id}=`),
    );
    expect(setCookieHeader).toBeDefined();
    const unlockCookie = setCookieHeader!.split(';')[0];

    const res = await request(server).get(`/api/r/${created.shortCode}`).set('Cookie', unlockCookie!).expect(302);
    expect(res.headers.location).toBe('https://example.com/landing');
  });

  it('rejects an incorrect unlock password with 401', async () => {
    const created = await createDynamicQr();
    await request(server)
      .put(`/api/v1/qr-codes/${created.id}/redirect-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'letmein123' })
      .expect(200);

    await request(server).post(`/api/r/${created.shortCode}/unlock`).send({ password: 'wrong' }).expect(401);
  });

  it('returns 410 for a deactivated QR code instead of redirecting', async () => {
    const created = await createDynamicQr();
    await request(server)
      .put(`/api/v1/qr-codes/${created.id}/redirect-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deactivateAt: new Date(Date.now() - 1000).toISOString() })
      .expect(200);

    await request(server).get(`/api/r/${created.shortCode}`).expect(410);
  });
});
