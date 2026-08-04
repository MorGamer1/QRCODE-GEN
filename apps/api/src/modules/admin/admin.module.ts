import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BackupsController } from './backups.controller';
import { BackupService } from './backup.service';

@Module({
  controllers: [AdminController, BackupsController],
  providers: [AdminService, BackupService],
})
export class AdminModule {}
