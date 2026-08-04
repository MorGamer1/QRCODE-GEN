import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import {
  ALLOWED_FILE_MIME_TYPES,
  ALLOWED_LOGO_MIME_TYPES,
  FILE_MAX_SIZE_BYTES,
  LOGO_MAX_SIZE_BYTES,
} from '@qrgen/shared';
import type { EnvSchema } from '../../common/config/env.validation';
import { PrismaService } from '../../common/prisma/prisma.service';

export type FileUploadPurpose = 'logo' | 'content';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase?: string;

  constructor(
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly prisma: PrismaService,
  ) {
    this.bucket = this.config.get('S3_BUCKET', { infer: true });
    this.publicUrlBase = this.config.get('S3_PUBLIC_URL', { infer: true });
    this.client = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT', { infer: true }),
      region: this.config.get('S3_REGION', { infer: true }),
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created storage bucket "${this.bucket}"`);
      } catch (error) {
        this.logger.warn(
          `Could not verify or create bucket "${this.bucket}" - check S3_* settings. (${(error as Error).message})`,
        );
      }
    }
  }

  async upload(
    userId: string,
    originalName: string,
    buffer: Buffer,
    purpose: FileUploadPurpose,
  ): Promise<{ id: string; url: string; mimeType: string; sizeBytes: number; originalName: string }> {
    const mimeType = await detectMimeType(buffer);

    const allowed = purpose === 'logo' ? ALLOWED_LOGO_MIME_TYPES : ALLOWED_FILE_MIME_TYPES;
    const maxSize = purpose === 'logo' ? LOGO_MAX_SIZE_BYTES : FILE_MAX_SIZE_BYTES;

    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
    if (buffer.byteLength > maxSize) {
      throw new BadRequestException(`File exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    let finalBuffer = buffer;
    let finalMime: string = mimeType;
    if (purpose === 'logo' && (mimeType === 'image/jpeg' || mimeType === 'image/webp')) {
      // Re-encode raster logos to strip metadata (EXIF may carry scripts/tracking) and normalize format.
      finalBuffer = await sharp(buffer).png().toBuffer();
      finalMime = 'image/png';
    } else if (mimeType === 'image/svg+xml') {
      // Basic defense-in-depth: strip active content. Not a substitute for serving uploads from an
      // isolated origin/CSP - logos are embedded via <image>, which browsers never execute as script.
      finalBuffer = Buffer.from(sanitizeSvg(buffer.toString('utf-8')), 'utf-8');
    }

    const extension = finalMime.split('/')[1]?.replace('+xml', '') ?? 'bin';
    const key = `${userId}/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: finalBuffer, ContentType: finalMime }),
    );

    const file = await this.prisma.fileAsset.create({
      data: {
        userId,
        key,
        url: this.publicUrlBase ? `${this.publicUrlBase}/${key}` : key,
        mimeType: finalMime,
        sizeBytes: finalBuffer.byteLength,
        originalName,
      },
    });

    return { ...file, url: await this.resolveUrl(file.key) };
  }

  async resolveUrl(key: string): Promise<string> {
    if (this.publicUrlBase) return `${this.publicUrlBase}/${key}`;
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
  }

  async getBuffer(fileId: string, userId?: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!file || (userId && file.userId !== userId)) throw new NotFoundException('File not found');

    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: file.key }));
    const buffer = Buffer.from(await response.Body!.transformToByteArray());
    return { buffer, mimeType: file.mimeType };
  }

  async delete(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId) throw new NotFoundException('File not found');
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: file.key }));
    await this.prisma.fileAsset.delete({ where: { id: fileId } });
  }

  async listForUser(userId: string) {
    const files = await this.prisma.fileAsset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return Promise.all(files.map(async (f) => ({ ...f, url: await this.resolveUrl(f.key) })));
  }
}

/**
 * `file-type` sniffs magic bytes, which XML-based formats like SVG don't have -
 * it will never report `image/svg+xml`. Fall back to a light textual check.
 */
async function detectMimeType(buffer: Buffer): Promise<string> {
  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed) return sniffed.mime;

  const head = buffer.subarray(0, 512).toString('utf-8').trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'image/svg+xml';
  }
  return 'application/octet-stream';
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/xlink:href\s*=\s*(["'])\s*javascript:.*?\1/gi, '')
    .replace(/href\s*=\s*(["'])\s*javascript:.*?\1/gi, '');
}
