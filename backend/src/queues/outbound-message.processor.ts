import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { logMsg } from '../common/logger/app-logger.service';
import { OUTBOUND_MESSAGE_QUEUE } from './queues.constants';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface OutboundMessageJobData {
  messageId: string;
  workspaceId: string;
  conversationId: string;
  whatsappAccountId: string;
  toPhone: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyToExternalId: string | null;
  interactiveType: string | null;
  interactivePayload: Record<string, unknown> | null;
}

// Códigos de erro da Meta que NÃO devem ser retentados
const NON_RETRYABLE_CODES = new Set([
  131030, // Número inválido ou inexistente
  131047, // Janela de 24h expirada
  131048, // Template não aprovado
  131052, // Tipo de mídia não permitido
  131056, // Conta inativa para envio
  132001, // Template inválido
  100,    // Invalid parameter (400)
  190,    // Token expirado / inválido
]);

function isNonRetryable(statusCode: number, metaCode?: number): boolean {
  if (statusCode === 401) return true;
  if (metaCode && NON_RETRYABLE_CODES.has(metaCode)) return true;
  // 4xx (exceto 429 rate limit) são erros permanentes
  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) return true;
  return false;
}

@Processor(OUTBOUND_MESSAGE_QUEUE)
export class OutboundMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboundMessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private gateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<OutboundMessageJobData>) {
    const {
      messageId,
      workspaceId,
      conversationId,
      whatsappAccountId,
      toPhone,
      type,
      content,
      mediaUrl,
      replyToExternalId,
      interactiveType,
      interactivePayload,
    } = job.data;

    this.logger.log(
      logMsg('[Outbound] Processando job', {
        jobId: job.id,
        messageId,
        workspaceId,
        conversationId,
        type,
        attempt: job.attemptsMade + 1,
      }),
    );

    // Marcar como "sending" (novo valor de enum — requer migration para tipagem)
    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'sending' as any },
    });

    let externalId: string;

    try {
      const isInteractive = type === 'interactive';
      const isMediaType = ['image', 'audio', 'video', 'document'].includes(type);

      if (type === 'text' || !type) {
        externalId = await this.whatsapp.sendTextMessage(
          whatsappAccountId,
          toPhone,
          content!,
          replyToExternalId,
        );
      } else if (isMediaType) {
        externalId = await this.whatsapp.sendMediaMessage(
          whatsappAccountId,
          toPhone,
          type as 'image' | 'document' | 'audio' | 'video',
          mediaUrl!,
          content ?? undefined,
          replyToExternalId,
        );
      } else if (isInteractive) {
        externalId = await this.whatsapp.sendInteractiveMessage(
          whatsappAccountId,
          toPhone,
          interactiveType!,
          interactivePayload!,
          replyToExternalId,
        );
      } else {
        externalId = '';
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(
        logMsg('[Outbound] Falha ao enviar', {
          jobId: job.id,
          messageId,
          workspaceId,
          conversationId,
          attempt: job.attemptsMade + 1,
          reason,
        }),
      );

      // Classificar erro
      const statusMatch = reason.match(/status[:\s]+(\d{3})/i);
      const codeMatch = reason.match(/"code"\s*:\s*(\d+)/);
      const httpStatus = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      const metaCode = codeMatch ? parseInt(codeMatch[1], 10) : undefined;

      if (isNonRetryable(httpStatus, metaCode)) {
        // Erro permanente — marcar como failed sem retry
        await this.markFailed(messageId, workspaceId, conversationId, reason);
        throw new UnrecoverableError(reason);
      }

      // Erro transitório — BullMQ vai retentar com backoff
      throw err;
    }

    // Sucesso
    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'sent', externalId: externalId || null },
    });

    this.gateway.emitToWorkspace(workspaceId, 'message_status', {
      conversationId,
      messageId,
      status: 'sent',
      externalId: externalId || null,
    });

    this.logger.log(
      `[Outbound] Enviado messageId=${messageId} externalId=${externalId}`,
    );
  }

  private async markFailed(
    messageId: string,
    workspaceId: string,
    conversationId: string,
    reason: string,
  ) {
    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'failed' as any, failureReason: reason.slice(0, 500) } as any,
    });

    this.gateway.emitToWorkspace(workspaceId, 'message_status', {
      conversationId,
      messageId,
      status: 'failed',
      failureReason: reason.slice(0, 500),
    });
  }
}
