import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { RedisService } from '../../src/common/redis/redis.service';

/**
 * Boots the real app (full module graph, real Postgres/Redis from .env.test) the same way
 * main.ts does, minus HTTP-listening concerns (helmet, CORS, Swagger, `app.listen()`) that
 * don't matter for supertest hitting the Express instance directly.
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: false });
  app.use(cookieParser('e2e-test-cookie-secret-not-for-production-0000'));
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

/**
 * Deletes all test data so each e2e spec file starts from a clean slate, without re-running
 * migrations. Every table in the schema cascades from User (`onDelete: Cascade`) except
 * AuditLog, which intentionally survives user deletion with userId set to null (see
 * schema.prisma) - so only those two deletes are needed for the whole graph to clear.
 */
export async function cleanDatabase(app: NestExpressApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  const redis = app.get(RedisService);
  await redis.client.flushdb();
}
