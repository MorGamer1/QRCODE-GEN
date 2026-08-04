import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { EnvSchema } from '../config/env.validation';
import { SCAN_EVENTS_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvSchema, true>) => ({
        connection: { url: config.get('REDIS_URL', { infer: true }) },
      }),
    }),
    BullModule.registerQueue({
      name: SCAN_EVENTS_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 3600, count: 10_000 },
        removeOnFail: { age: 86_400 },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
