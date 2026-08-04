import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { QrCodesService } from './qr-codes.service';
import {
  BulkActionDto,
  CreateQrCodeDto,
  DuplicateQrDto,
  ListQrQueryDto,
  QrExportQueryDto,
  RedirectSettingsDto,
  UpdateQrContentDto,
  UpdateQrDesignDto,
  UpdateQrMetaDto,
} from './dto';

@ApiTags('qr-codes')
@Controller({ path: 'qr-codes', version: '1' })
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateQrCodeDto) {
    return this.qrCodesService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListQrQueryDto) {
    return this.qrCodesService.findAllForUser(user.id, query);
  }

  @Post('bulk')
  bulkAction(@CurrentUser() user: RequestUser, @Body() dto: BulkActionDto) {
    return this.qrCodesService.bulkAction(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.qrCodesService.findOneForUser(user.id, id);
  }

  @Patch(':id/meta')
  updateMeta(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateQrMetaDto,
  ) {
    return this.qrCodesService.updateMeta(user.id, id, dto);
  }

  @Put(':id/design')
  updateDesign(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateQrDesignDto,
  ) {
    return this.qrCodesService.updateDesign(user.id, id, dto);
  }

  @Put(':id/content')
  updateContent(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateQrContentDto,
  ) {
    return this.qrCodesService.updateContent(user.id, id, dto);
  }

  @Put(':id/redirect-settings')
  updateRedirectSettings(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RedirectSettingsDto,
  ) {
    return this.qrCodesService.updateRedirectSettings(user.id, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DuplicateQrDto,
  ) {
    return this.qrCodesService.duplicate(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.qrCodesService.remove(user.id, id);
    return { success: true };
  }

  @Get(':id/export')
  async export(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query() query: QrExportQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, fileName } = await this.qrCodesService.export(user.id, id, query);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
