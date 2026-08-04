import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ScanProcessor } from './processors/scan.processor';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ScanProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
