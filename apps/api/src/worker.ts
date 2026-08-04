import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Analytics worker entry point: no HTTP listener, just a Nest application
 * context so BullMQ processors (registered via @Processor in AnalyticsModule)
 * pick up jobs enqueued by the API's redirect controller. Runs as its own
 * container (`worker` service in docker-compose.yml) so scan processing
 * scales independently of request traffic.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');
  app.enableShutdownHooks();
  logger.log('Analytics worker started');
}

bootstrap();
