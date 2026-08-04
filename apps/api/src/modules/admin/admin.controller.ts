import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminListQrQueryDto, AdminListUsersQueryDto, AdminSettingsDto, AdminUpdateUserDto, AuditLogQueryDto } from './dto';

@ApiTags('admin')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(@Query() query: AdminListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() admin: RequestUser, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(admin.id, id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@CurrentUser() admin: RequestUser, @Param('id') id: string) {
    await this.adminService.deleteUser(admin.id, id);
    return { success: true };
  }

  @Get('qr-codes')
  listQrCodes(@Query() query: AdminListQrQueryDto) {
    return this.adminService.listQrCodes(query);
  }

  @Delete('qr-codes/:id')
  @HttpCode(HttpStatus.OK)
  async deleteQrCode(@CurrentUser() admin: RequestUser, @Param('id') id: string) {
    await this.adminService.deleteQrCode(admin.id, id);
    return { success: true };
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@CurrentUser() admin: RequestUser, @Body() dto: AdminSettingsDto) {
    return this.adminService.updateSettings(admin.id, dto);
  }

  @Get('audit-logs')
  auditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.auditLogs(query);
  }
}
