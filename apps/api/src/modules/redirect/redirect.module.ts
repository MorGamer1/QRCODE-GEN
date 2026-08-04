import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
