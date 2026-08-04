import { Global, Module } from '@nestjs/common';
import { RedirectCacheService } from './redirect-cache.service';

@Global()
@Module({
  providers: [RedirectCacheService],
  exports: [RedirectCacheService],
})
export class RedirectCacheModule {}
