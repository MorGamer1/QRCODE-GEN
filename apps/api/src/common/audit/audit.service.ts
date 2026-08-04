import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogInput {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget by design: an audit log failure should never fail the request it's logging. */
  record(input: AuditLogInput): void {
    this.prisma.auditLog
      .create({
        data: {
          userId: input.userId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      })
      .catch((error: Error) => this.logger.error(`Failed to write audit log: ${error.message}`));
  }
}
