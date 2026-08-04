import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto';

@ApiTags('api-keys')
@Controller({ path: 'api-keys', version: '1' })
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.apiKeysService.list(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revoke(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.apiKeysService.revoke(user.id, id);
    return { success: true };
  }
}
