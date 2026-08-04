import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BackupService } from './backup.service';

@ApiTags('admin')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'admin/backups', version: '1' })
export class BackupsController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  list() {
    return this.backupService.list();
  }

  @Post()
  create() {
    return this.backupService.create();
  }

  @Get(':fileName/download')
  async download(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = await this.backupService.resolvePath(fileName);
    res.download(filePath, fileName);
  }

  @Delete(':fileName')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('fileName') fileName: string) {
    await this.backupService.delete(fileName);
    return { success: true };
  }
}
