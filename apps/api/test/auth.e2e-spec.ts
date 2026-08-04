import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { cleanDatabase, createTestApp } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let server: Parameters<typeof request>[0];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const validUser = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'CorrectHorse123' };

  describe('POST /api/v1/auth/register', () => {
    it('creates an account and logs in immediately (email verification off by default)', async () => {
      const res = await request(server).post('/api/v1/auth/register').send(validUser).expect(201);

      expect(res.body.user).toMatchObject({ email: validUser.email, name: validUser.name });
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.requiresEmailVerification).toBe(false);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('rejects a duplicate email with 409', async () => {
      await request(server).post('/api/v1/auth/register').send(validUser).expect(201);
      await request(server).post('/api/v1/auth/register').send(validUser).expect(409);
    });

    it('rejects a password missing an uppercase letter / digit (400)', async () => {
      await request(server)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'weak@example.com', password: 'alllowercase' })
        .expect(400);
    });

    it('rejects an invalid email address (400)', async () => {
      await request(server)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'not-an-email' })
        .expect(400);
    });

    it('never returns passwordHash anywhere in the response', async () => {
      const res = await request(server).post('/api/v1/auth/register').send(validUser).expect(201);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without a token', async () => {
      await request(server).get('/api/v1/auth/me').expect(401);
    });

    it('returns the current user with a valid bearer token', async () => {
      const { body } = await request(server).post('/api/v1/auth/register').send(validUser).expect(201);
      const res = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);
      expect(res.body.email).toBe(validUser.email);
    });

    it('returns 401 for a garbage token', async () => {
      await request(server).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(server).post('/api/v1/auth/register').send(validUser).expect(201);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects an incorrect password with 401', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword123' })
        .expect(401);
    });

    it('rejects an unknown email with 401 (not 404 - avoid user enumeration)', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'WhateverPassword123' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh + rotation', () => {
    it('issues a new access token via the refresh cookie', async () => {
      const agent = request.agent(server);
      await agent.post('/api/v1/auth/register').send(validUser).expect(201);

      const res = await agent.post('/api/v1/auth/refresh').expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('returns 401 with no refresh cookie presented', async () => {
      await request(server).post('/api/v1/auth/refresh').expect(401);
    });

    it('rejects reuse of an already-rotated refresh token (theft detection)', async () => {
      const agent = request.agent(server);
      const registerRes = await agent.post('/api/v1/auth/register').send(validUser).expect(201);

      const originalRefreshCookie = (registerRes.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.startsWith('refresh_token='),
      );
      expect(originalRefreshCookie).toBeDefined();
      const originalRefresh = originalRefreshCookie!.split(';')[0];

      // First refresh rotates it via the agent's own cookie jar - should succeed.
      await agent.post('/api/v1/auth/refresh').expect(201);

      // Replaying the pre-rotation token on a fresh (cookie-less) client should now fail.
      await request(server).post('/api/v1/auth/refresh').set('Cookie', originalRefresh!).expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the session so the refresh token stops working', async () => {
      const agent = request.agent(server);
      await agent.post('/api/v1/auth/register').send(validUser).expect(201);

      await agent.post('/api/v1/auth/logout').expect(200);
      await agent.post('/api/v1/auth/refresh').expect(401);
    });
  });
});
