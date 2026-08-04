import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsExportQueryDto,
  AnalyticsRangeDto,
  BreakdownQueryDto,
  ScanListQueryDto,
} from './dto';

@ApiTags('analytics')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: RequestUser, @Query() range: AnalyticsRangeDto) {
    return this.analyticsService.overview(user.id, range);
  }

  @Get('qr/:id/summary')
  summary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.analyticsService.summary(user.id, id);
  }

  @Get('qr/:id/timeseries')
  timeseries(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() range: AnalyticsRangeDto,
  ) {
    return this.analyticsService.timeseries(user.id, id, range);
  }

  @Get('qr/:id/breakdown')
  breakdown(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: BreakdownQueryDto,
  ) {
    return this.analyticsService.breakdown(user.id, id, query);
  }

  @Get('qr/:id/scans')
  scanList(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: ScanListQueryDto,
  ) {
    return this.analyticsService.scanList(user.id, id, query);
  }

  @Get('qr/:id/export')
  async exportScans(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: AnalyticsExportQueryDto,
    @Res() res: Response,
  ) {
    const { body, contentType, fileName } = await this.analyticsService.exportScans(
      user.id,
      id,
      query,
    );
    res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(body);
  }
}
