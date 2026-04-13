import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

const WINDOW_24H_MS = 24 * 60 * 60 * 1000;
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SchedulerService } from '../queues/scheduler.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private eventsGateway: EventsGateway,
    private flowExecutor: FlowExecutorService,
    private scheduler: SchedulerService,
  ) {}

  // ─── Listar mensagens de uma conversa ────────────────────────────────────────

  async findByConversation(
    conversationId: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
    cursor?: string,
    take = 50,
  ) {
    // Verificar acesso à conversa
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const canViewAll = permissions.includes('view_all_conversations');
    if (!canViewAll && conversation.assignedUserId !== userId) {
      throw new ForbiddenException('Sem acesso a essa conversa');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // ─── Busca full-text em mensagens do workspace ──────────────────────────────

  async search(
    q: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
  ) {
    if (!q?.trim()) return [];
    const canViewAll = permissions.includes('view_all_conversations');

    return this.prisma.message.findMany({
      where: {
        content: { contains: q.trim(), mode: 'insensitive' },
        conversation: {
          workspaceId,
          ...(canViewAll ? {} : { assignedUserId: userId }),
        },
      },
      include: {
        conversation: {
          include: {
            contact: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ─── Enviar mensagem (operador → contato) ───────────────────────────────────

  async send(
    dto: SendMessageDto,
    workspaceId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    const isInteractive = dto.type === 'interactive';
    if (isInteractive) {
      if (!dto.interactiveType || !dto.interactivePayload) {
        throw new BadRequestException(
          'Mensagem interativa deve incluir tipo e payload',
        );
      }
    } else if (!dto.content && !dto.mediaUrl) {
      throw new BadRequestException('Mensagem deve ter conteúdo ou mídia');
    }

    // Buscar conversa com conta WhatsApp e contato
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: dto.conversationId, workspaceId },
      include: {
        whatsappAccount: true,
        contact: true,
      },
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    if (conversation.status === 'closed') {
      throw new BadRequestException(
        'Não é possível enviar mensagem em conversa fechada',
      );
    }

    // ── Lock de conversa ──────────────────────────────────────────────────────
    // Apenas o operador atribuído pode responder.
    // Quem tem view_all_conversations (admin/supervisor) pode responder qualquer uma.
    const canViewAll = permissions.includes('view_all_conversations');
    if (
      !canViewAll &&
      conversation.assignedUserId &&
      conversation.assignedUserId !== userId
    ) {
      throw new ForbiddenException('Conversa atribuída a outro operador');
    }

    // Parar bot se estiver ativo — operador assumiu
    if (conversation.isBotActive) {
      await this.flowExecutor.stopBotForConversation(
        dto.conversationId,
        conversation.contactId,
      );
    }

    // Cancelar follow-ups pendentes — operador respondeu
    this.scheduler
      .cancelFollowUps(dto.conversationId, workspaceId)
      .catch(() => null);

    // ── Verificar janela de 24h ───────────────────────────────────────────────
    const isMediaType = ['image', 'audio', 'video', 'document'].includes(
      dto.type ?? '',
    );
    const isFreeMessage =
      dto.type === 'text' || !dto.type || isMediaType || isInteractive;

    if (isFreeMessage) {
      const lastContact = conversation.lastContactMessageAt;
      const windowOpen =
        lastContact &&
        Date.now() - new Date(lastContact).getTime() < WINDOW_24H_MS;

      if (!windowOpen) {
        throw new ForbiddenException(
          'Janela de 24h expirada. Use um template aprovado para iniciar contato.',
        );
      }
    }

    // Salvar mensagem no banco com status "sent" (otimista)
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderType: 'user',
        senderId: userId,
        type: dto.type ?? 'text',
        content: dto.content ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        interactiveType: dto.interactiveType ?? null,
        interactivePayload: dto.interactivePayload
          ? (JSON.parse(
              JSON.stringify(dto.interactivePayload),
            ) as Prisma.InputJsonValue)
          : undefined,
        status: 'sent',
      },
    });

    // Atualizar lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date(), unreadCount: 0 },
    });

    // Emitir pelo WebSocket imediatamente
    this.eventsGateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId: dto.conversationId,
      message,
      unreadCount: 0,
    });

    // ── Enviar pela API do WhatsApp ───────────────────────────────────────────
    try {
      let externalId: string;

      if (dto.type === 'text' || !dto.type) {
        externalId = await this.whatsappService.sendTextMessage(
          conversation.whatsappAccountId,
          conversation.contact.phone,
          dto.content!,
        );
      } else if (isMediaType) {
        externalId = await this.whatsappService.sendMediaMessage(
          conversation.whatsappAccountId,
          conversation.contact.phone,
          dto.type as 'image' | 'document' | 'audio' | 'video',
          dto.mediaUrl!,
          dto.content ?? undefined,
        );
      } else if (isInteractive) {
        externalId = await this.whatsappService.sendInteractiveMessage(
          conversation.whatsappAccountId,
          conversation.contact.phone,
          dto.interactiveType!,
          dto.interactivePayload!,
        );
      } else {
        externalId = '';
      }

      if (externalId) {
        await this.prisma.message.update({
          where: { id: message.id },
          data: { externalId },
        });
      }
    } catch (err) {
      this.logger.error(`Erro ao enviar mensagem: ${err}`);
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'failed' },
      });
    }

    return message;
  }
}
