import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { RedirectRulesController } from './redirect-rules.controller';
import { RedirectRulesService } from './redirect-rules.service';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [QrCodesController, CategoriesController, RedirectRulesController],
  providers: [QrCodesService, CategoriesService, RedirectRulesService],
  exports: [QrCodesService],
})
export class QrCodesModule {}
