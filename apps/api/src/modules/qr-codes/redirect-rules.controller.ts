import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { RedirectRulesService } from './redirect-rules.service';
import { CreateRedirectRuleDto, ReorderRedirectRulesDto, UpdateRedirectRuleDto } from './dto';

@ApiTags('qr-codes')
@Controller({ path: 'qr-codes/:qrCodeId/rules', version: '1' })
export class RedirectRulesController {
  constructor(private readonly rulesService: RedirectRulesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Param('qrCodeId') qrCodeId: string) {
    return this.rulesService.list(user.id, qrCodeId);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: CreateRedirectRuleDto,
  ) {
    return this.rulesService.create(user.id, qrCodeId, dto);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(
    @CurrentUser() user: RequestUser,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: ReorderRedirectRulesDto,
  ) {
    await this.rulesService.reorder(user.id, qrCodeId, dto);
    return { success: true };
  }

  @Put(':ruleId')
  update(
    @CurrentUser() user: RequestUser,
    @Param('qrCodeId') qrCodeId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRedirectRuleDto,
  ) {
    return this.rulesService.update(user.id, qrCodeId, ruleId, dto);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('qrCodeId') qrCodeId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.rulesService.remove(user.id, qrCodeId, ruleId);
    return { success: true };
  }
}
