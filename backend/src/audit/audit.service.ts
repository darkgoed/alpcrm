import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogInput {
  workspaceId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  log(input: AuditLogInput): void {
    this.prisma.auditLog
      .create({
        data: {
          workspaceId: input.workspaceId,
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
      .catch((err: unknown) => {
        this.logger.error('Failed to write audit log', err);
      });
  }
}
