import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: RequestUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/sessions')
  listSessions(@CurrentUser() user: RequestUser) {
    return this.usersService.listSessions(user.id);
  }

  @Delete('me/sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@CurrentUser() user: RequestUser, @Param('id') sessionId: string) {
    await this.usersService.revokeSession(user.id, sessionId);
    return { success: true };
  }
}
