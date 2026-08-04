import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
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
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<EnvSchema, true>);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: false, // the web app (Next.js) sets its own CSP; the API only ever returns JSON/binary
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(config.get('COOKIE_SECRET', { infer: true })));

  app.enableCors({
    origin: config.get('WEB_BASE_URL', { infer: true }).split(','),
    credentials: true,
  });

  // Short redirect URLs (`/r/:code`) stay unprefixed so printed QR codes carry the shortest
  // possible path; everything else lives under /api.
  app.setGlobalPrefix('api', { exclude: ['r/*path', 'health'] });
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
