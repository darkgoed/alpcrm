import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FOLLOW_UP_QUEUE } from './queues.constants';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface FollowUpJobData {
  conversationId: string;
  workspaceId: string;
  contactId: string;
  ruleId: string;
  message: string;
  scheduledAt: string; // ISO — horário em que o job foi agendado
}

@Processor(FOLLOW_UP_QUEUE)
export class FollowUpProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowUpProcessor.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private gateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<FollowUpJobData>) {
    const {
      conversationId,
      workspaceId,
      contactId,
      ruleId,
      message,
      scheduledAt,
    } = job.data;

    // Busca conversa atualizada
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conv || conv.status === 'closed') {
      this.logger.log(
        `[FollowUp] Conversa ${conversationId} fechada — job ignorado`,
      );
      return;
    }

    // Verifica se houve mensagem do contato após o agendamento
    const scheduled = new Date(scheduledAt);
    const lastContactMsg = await this.prisma.message.findFirst({
      where: {
        conversationId,
        senderType: 'contact',
        createdAt: { gt: scheduled },
      },
    });

    if (lastContactMsg) {
      this.logger.log(
        `[FollowUp] Contato respondeu após agendamento — job ignorado`,
      );
      return;
    }

    // Verifica se a regra ainda está ativa
    const rule = await this.prisma.followUpRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule?.isActive) return;

    // Envia mensagem de follow-up
    try {
      const externalId = await this.whatsapp.sendTextMessage(
        conv.whatsappAccountId,
        conv.contact.phone,
        message,
      );

      const saved = await this.prisma.message.create({
        data: {
          conversationId,
          senderType: 'system',
          type: 'text',
          content: message,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      this.gateway.emitToWorkspace(workspaceId, 'new_message', {
        conversationId,
        message: saved,
      });

      this.logger.log(
        `[FollowUp] Mensagem enviada para conversa ${conversationId}`,
      );
    } catch (err) {
      this.logger.error(`[FollowUp] Falha ao enviar: ${err}`);
      throw err; // BullMQ fará retry automático
    }
  }
}
