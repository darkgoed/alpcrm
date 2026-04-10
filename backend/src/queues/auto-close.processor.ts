import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AUTO_CLOSE_QUEUE } from './queues.constants';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface AutoCloseJobData {
  conversationId: string;
  workspaceId: string;
  scheduledAt: string;
}

@Processor(AUTO_CLOSE_QUEUE)
export class AutoCloseProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoCloseProcessor.name);

  constructor(
    private prisma: PrismaService,
    private gateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<AutoCloseJobData>) {
    const { conversationId, workspaceId, scheduledAt } = job.data;

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv || conv.status === 'closed') return;

    // Verifica se houve atividade após o agendamento
    const scheduled = new Date(scheduledAt);
    if (conv.lastMessageAt && conv.lastMessageAt > scheduled) {
      this.logger.log(`[AutoClose] Conversa ${conversationId} teve atividade — não encerrada`);
      return;
    }

    // Verifica configuração do workspace
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings?.autoCloseHours) return;

    // Fecha a conversa
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'closed', isBotActive: false },
    });

    // Mensagem de sistema
    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        senderType: 'system',
        type: 'text',
        content: '🔒 Conversa encerrada automaticamente por inatividade.',
        status: 'sent',
      },
    });

    this.gateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId,
      message: msg,
    });

    this.logger.log(`[AutoClose] Conversa ${conversationId} encerrada por inatividade`);
  }
}
