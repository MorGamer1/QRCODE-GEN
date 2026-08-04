import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { createGzip } from 'zlib';
import { createWriteStream } from 'fs';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import type { EnvSchema } from '../../common/config/env.validation';

export interface BackupFileInfo {
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
}

const BACKUP_FILE_PATTERN = /^backup-[\w-]+\.sql\.gz$/;

/**
 * Triggers `pg_dump` (piped through Node's built-in gzip, no shell pipe) and
 * writes the result to BACKUP_DIR - a persistent volume in docker-compose.
 * See docs/BACKUP.md for the recommended cron schedule and off-site copy
 * strategy; this only covers the on-demand/admin-triggered path.
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private readonly config: ConfigService<EnvSchema, true>) {
    this.backupDir = this.config.get('BACKUP_DIR', { infer: true });
  }

  async list(): Promise<BackupFileInfo[]> {
    await mkdir(this.backupDir, { recursive: true });
    const files = await readdir(this.backupDir);
    const infos = await Promise.all(
      files
        .filter((f) => BACKUP_FILE_PATTERN.test(f))
        .map(async (fileName) => {
          const s = await stat(join(this.backupDir, fileName));
          return { fileName, sizeBytes: s.size, createdAt: s.birthtime };
        }),
    );
    return infos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async create(): Promise<BackupFileInfo> {
    await mkdir(this.backupDir, { recursive: true });
    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql.gz`;
    const filePath = join(this.backupDir, fileName);
    const { connectionString, schema } = toPgDumpConnection(this.config.get('DATABASE_URL', { infer: true }));

    await new Promise<void>((resolve, reject) => {
      const dump = spawn('pg_dump', [
        connectionString,
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--schema',
        schema,
      ]);
      const gzip = createGzip();
      const out = createWriteStream(filePath);
      let stderr = '';

      dump.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      dump.on('error', reject);
      out.on('error', reject);
      out.on('finish', resolve);

      dump.stdout.pipe(gzip).pipe(out);
      dump.on('close', (code) => {
        if (code !== 0) reject(new Error(`pg_dump exited with code ${code}: ${stderr.slice(0, 2000)}`));
      });
    });

    this.logger.log(`Backup created: ${fileName}`);
    const s = await stat(filePath);
    return { fileName, sizeBytes: s.size, createdAt: s.birthtime };
  }

  async resolvePath(fileName: string): Promise<string> {
    if (!BACKUP_FILE_PATTERN.test(fileName)) throw new BadRequestException('Invalid backup file name');
    const filePath = join(this.backupDir, fileName);
    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('Backup not found');
    }
    return filePath;
  }

  async delete(fileName: string): Promise<void> {
    const filePath = await this.resolvePath(fileName);
    await unlink(filePath);
  }
}

/**
 * Prisma's DATABASE_URL carries a `schema` query parameter that libpq/pg_dump
 * don't recognize ("invalid URI query parameter"). Strip it and pass the
 * schema as a separate --schema flag instead, defaulting to "public" to
 * match Prisma's own default.
 */
function toPgDumpConnection(prismaUrl: string): { connectionString: string; schema: string } {
  const url = new URL(prismaUrl);
  const schema = url.searchParams.get('schema') || 'public';
  url.searchParams.delete('schema');
  return { connectionString: url.toString(), schema };
}
