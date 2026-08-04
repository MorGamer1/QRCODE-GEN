import { Injectable } from '@nestjs/common';
import type { SystemSetting } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_KEY = 'system-settings:singleton';
const CACHE_TTL_SECONDS = 30;

/**
 * Wraps the single-row SystemSetting table with a short-lived Redis cache -
 * these settings (GDPR IP logging, registration toggle, etc.) are read on
 * hot paths like every scan and every login, but change rarely.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async get(): Promise<SystemSetting> {
    const cached = await this.redis.getJson<SystemSetting>(CACHE_KEY);
    if (cached) return cached;

    const settings = await this.prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    await this.redis.setJson(CACHE_KEY, settings, CACHE_TTL_SECONDS);
    return settings;
  }

  async update(patch: Partial<SystemSetting>): Promise<SystemSetting> {
    const updated = await this.prisma.systemSetting.update({
      where: { id: 'singleton' },
      data: patch,
    });
    await this.redis.del(CACHE_KEY);
    return updated;
  }
}
