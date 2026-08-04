import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { SettingsModule } from './common/settings/settings.module';
import { AuditModule } from './common/audit/audit.module';
import { EmailModule } from './common/email/email.module';
import { RedirectCacheModule } from './common/redirect-cache/redirect-cache.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './common/config/env.validation';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { QrCodesModule } from './modules/qr-codes/qr-codes.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AdminModule } from './modules/admin/admin.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    RedisModule,
    SettingsModule,
    AuditModule,
    EmailModule,
    RedirectCacheModule,
    AuthModule,
    UsersModule,
    QrCodesModule,
    RedirectModule,
    AnalyticsModule,
    ApiKeysModule,
    AdminModule,
    FilesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
