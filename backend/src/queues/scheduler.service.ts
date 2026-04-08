import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  FOLLOW_UP_QUEUE,
  AUTO_CLOSE_QUEUE,
  FLOW_DELAY_QUEUE,
} from './queues.module';
import type { FollowUpJobData } from './follow-up.processor';
import type { AutoCloseJobData } from './auto-close.processor';
import type { FlowDelayJobData } from './flow-delay.processor';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(FOLLOW_UP_QUEUE) private followUpQueue: Queue,
    @InjectQueue(AUTO_CLOSE_QUEUE) private autoCloseQueue: Queue,
    @InjectQueue(FLOW_DELAY_QUEUE) private flowDelayQueue: Queue,
  ) {}

  // ─── Agendar follow-ups para uma conversa ───────────────────────────────────

  async scheduleFollowUps(conversationId: string, workspaceId: string, contactId: string) {
    const rules = await this.prisma.followUpRule.findMany({
      where: { workspaceId, isActive: true },
    });

    const scheduledAt = new Date().toISOString();

    for (const rule of rules) {
      const delayMs = rule.delayHours * 60 * 60 * 1000;
      const jobId = `follow-up:${conversationId}:${rule.id}`;

      // Remove job anterior se existir (reinicia o timer)
      await this.followUpQueue.remove(jobId).catch(() => null);

      await this.followUpQueue.add(
        'follow-up',
        {
          conversationId,
          workspaceId,
          contactId,
          ruleId: rule.id,
          message: rule.message,
          scheduledAt,
        } satisfies FollowUpJobData,
        {
          jobId,
          delay: delayMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );

      this.logger.log(`[FollowUp] Agendado para conversa ${conversationId} em ${rule.delayHours}h`);
    }
  }

  // ─── Cancelar follow-ups (contato respondeu) ────────────────────────────────

  async cancelFollowUps(conversationId: string, workspaceId: string) {
    const rules = await this.prisma.followUpRule.findMany({ where: { workspaceId } });

    for (const rule of rules) {
      const jobId = `follow-up:${conversationId}:${rule.id}`;
      await this.followUpQueue.remove(jobId).catch(() => null);
    }
  }

  // ─── Agendar auto-close ──────────────────────────────────────────────────────

  async scheduleAutoClose(conversationId: string, workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.autoCloseHours) return;

    const delayMs = settings.autoCloseHours * 60 * 60 * 1000;
    const jobId = `auto-close:${conversationId}`;
    const scheduledAt = new Date().toISOString();

    // Reinicia o timer toda vez que chega nova mensagem
    await this.autoCloseQueue.remove(jobId).catch(() => null);

    await this.autoCloseQueue.add(
      'auto-close',
      { conversationId, workspaceId, scheduledAt } satisfies AutoCloseJobData,
      { jobId, delay: delayMs, attempts: 2 },
    );
  }

  async cancelAutoClose(conversationId: string) {
    await this.autoCloseQueue.remove(`auto-close:${conversationId}`).catch(() => null);
  }

  // ─── Delay de flow ───────────────────────────────────────────────────────────

  async scheduleFlowDelay(
    delayMs: number,
    nextNodeId: string,
    conversationId: string,
    contactId: string,
    flowId: string,
  ) {
    await this.flowDelayQueue.add(
      'flow-delay',
      { nextNodeId, conversationId, contactId, flowId } satisfies FlowDelayJobData,
      { delay: delayMs, attempts: 2 },
    );
  }
}
