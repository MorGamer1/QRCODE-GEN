import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, VersioningType } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { EnvSchema } from './common/config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<EnvSchema, true>);
  const logger = new Logger('Bootstrap');

  // Deployed behind the nginx reverse proxy (see docker-compose.yml) - trust its X-Forwarded-* headers
  // so req.ip reflects the real client, not the proxy, for rate limiting and scan analytics.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // Covers both the JSON API (CSP is a no-op there) and the redirect module's landing pages,
      // which only ever use inline <style> and data:/https: images - no scripts, ever.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          styleSrc: ["'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          formAction: ["'self'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(config.get('COOKIE_SECRET', { infer: true })));

  app.enableCors({
    origin: config.get('WEB_BASE_URL', { infer: true }).split(','),
    credentials: true,
  });

  // Every route lives under /api internally (including /api/r/:code and /api/health, both
  // VERSION_NEUTRAL). The public, unprefixed short URLs QR codes actually encode
  // (`https://qr.example.com/r/:code`) are produced by nginx rewriting `/r/*` -> `/api/r/*`
  // at the edge (see infra/docker/nginx) - simpler and more robust than fighting global-prefix
  // exclusion patterns interacting with URI versioning.
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('QR Code Generator API')
    .setDescription('REST API for creating, managing and tracking QR codes')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'apiKey')
    .addTag('auth')
    .addTag('qr-codes')
    .addTag('analytics')
    .addTag('admin')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port} (docs at /api/docs)`);
}

bootstrap();
