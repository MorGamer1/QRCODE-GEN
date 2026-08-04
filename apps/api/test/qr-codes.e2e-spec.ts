import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { cleanDatabase, createTestApp } from './utils/test-app';

describe('QR Codes (e2e)', () => {
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

  function auth(req: request.Test): request.Test {
    return req.set('Authorization', `Bearer ${accessToken}`);
  }

  const staticUrlPayload = {
    type: 'STATIC',
    name: 'My website',
    content: { contentType: 'URL', data: { url: 'https://example.com' } },
  };

  describe('POST /api/v1/qr-codes', () => {
    it('rejects unauthenticated requests', async () => {
      await request(server).post('/api/v1/qr-codes').send(staticUrlPayload).expect(401);
    });

    it('creates a static QR code and returns it without a shortCode', async () => {
      const res = await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);
      expect(res.body).toMatchObject({ name: 'My website', type: 'STATIC' });
      expect(res.body.shortCode).toBeNull();
      expect(res.body.encodedPayload).toBe('https://example.com');
    });

    it('creates a dynamic QR code with a generated shortCode and short-URL payload', async () => {
      const res = await auth(request(server).post('/api/v1/qr-codes'))
        .send({ ...staticUrlPayload, type: 'DYNAMIC', name: 'Dynamic link' })
        .expect(201);
      expect(res.body.shortCode).toEqual(expect.any(String));
      expect(res.body.encodedPayload).toContain(`/r/${res.body.shortCode}`);
    });

    it('never leaks passwordHash in the response', async () => {
      const res = await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).toHaveProperty('hasPassword', false);
    });

    it('rejects invalid content for the declared content type (400)', async () => {
      await auth(request(server).post('/api/v1/qr-codes'))
        .send({ type: 'STATIC', name: 'Bad', content: { contentType: 'URL', data: { url: 'not-a-url' } } })
        .expect(400);
    });

    it('rejects content types that require a dynamic QR code when type is STATIC (400)', async () => {
      await auth(request(server).post('/api/v1/qr-codes'))
        .send({
          type: 'STATIC',
          name: 'App',
          content: { contentType: 'APP_STORE', data: { iosUrl: 'https://apps.apple.com/app/id123' } },
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/qr-codes', () => {
    it('lists only the current user\'s QR codes', async () => {
      await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);

      const otherUser = await request(server)
        .post('/api/v1/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: 'CorrectHorse123' })
        .expect(201);

      const mine = await auth(request(server).get('/api/v1/qr-codes')).expect(200);
      expect(mine.body.items).toHaveLength(1);

      const bobs = await request(server)
        .get('/api/v1/qr-codes')
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(200);
      expect(bobs.body.items).toHaveLength(0);
    });

    it('defaults isArchived filtering to only non-archived codes', async () => {
      // Regression coverage for the z.coerce.boolean() footgun fixed in packages/shared -
      // ?isArchived=false must not be coerced to true.
      await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);

      const res = await auth(request(server).get('/api/v1/qr-codes?isArchived=false')).expect(200);
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('GET /api/v1/qr-codes/:id', () => {
    it('returns 404 for another user\'s QR code (not leaked as 403)', async () => {
      const mine = await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);

      const otherUser = await request(server)
        .post('/api/v1/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: 'CorrectHorse123' })
        .expect(201);

      await request(server)
        .get(`/api/v1/qr-codes/${mine.body.id}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/qr-codes/:id/meta', () => {
    it('updates the name and reflects it on a subsequent GET', async () => {
      const created = await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);

      await auth(request(server).patch(`/api/v1/qr-codes/${created.body.id}/meta`))
        .send({ name: 'Renamed' })
        .expect(200);

      const res = await auth(request(server).get(`/api/v1/qr-codes/${created.body.id}`)).expect(200);
      expect(res.body.name).toBe('Renamed');
    });
  });

  describe('DELETE /api/v1/qr-codes/:id', () => {
    it('deletes the QR code so a subsequent GET 404s', async () => {
      const created = await auth(request(server).post('/api/v1/qr-codes')).send(staticUrlPayload).expect(201);

      await auth(request(server).delete(`/api/v1/qr-codes/${created.body.id}`)).expect(200);
      await auth(request(server).get(`/api/v1/qr-codes/${created.body.id}`)).expect(404);
    });
  });
});
