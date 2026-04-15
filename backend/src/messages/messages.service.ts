import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';

const WINDOW_24H_MS = 24 * 60 * 60 * 1000;
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SchedulerService } from '../queues/scheduler.service';
import { SendMessageDto } from './dto/send-message.dto';
import { OUTBOUND_MESSAGE_QUEUE } from '../queues/queues.constants';
import type { OutboundMessageJobData } from '../queues/outbound-message.processor';

type MessageReactionRecord = {
  emoji: string;
  senderType: 'user' | 'contact' | 'system';
  senderId: string | null;
  createdAt: string;
};

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private eventsGateway: EventsGateway,
    private flowExecutor: FlowExecutorService,
    private scheduler: SchedulerService,
    @InjectQueue(OUTBOUND_MESSAGE_QUEUE)
    private outboundQueue: Queue<OutboundMessageJobData>,
  ) {}

  // ─── Listar mensagens de uma conversa ────────────────────────────────────────

  async findByConversation(
    conversationId: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
    cursor?: string,
    take = 30,
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

    const normalizedTake = Math.min(Math.max(take, 1), 100);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        replyToMessage: {
          select: {
            id: true,
            type: true,
            content: true,
            mediaUrl: true,
            mimeType: true,
            fileName: true,
            metadata: true,
            deletedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: normalizedTake + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > normalizedTake;
    const items = messages.slice(0, normalizedTake).reverse();

    return {
      items,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[0].id : null,
    };
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
    this.assertPermission(['respond_conversation'], permissions);
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

    // ── Verificar opt-out do contato ──────────────────────────────────────────
    if (conversation.contact.optInStatus === 'opted_out') {
      throw new ForbiddenException(
        'Contato realizou opt-out e não pode receber mensagens outbound.',
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

    const hasAssignedOwner = Boolean(conversation.assignedUserId);
    const otherActiveOperators = this.eventsGateway
      .getActiveOperatorIds(dto.conversationId)
      .filter((activeUserId) => activeUserId !== userId);

    if (!hasAssignedOwner && otherActiveOperators.length > 0) {
      throw new ConflictException(
        'Outro operador ja esta com essa conversa aberta. Atribua a conversa antes de responder para evitar colisao.',
      );
    }

    // Parar bot se estiver ativo — operador assumiu
    if (conversation.isBotActive) {
      await this.flowExecutor.stopBotForConversation(
        dto.conversationId,
        conversation.contactId,
      );
    }

    let replyTargetExternalId: string | null = null;

    if (dto.replyToMessageId) {
      const replyTarget = await this.prisma.message.findFirst({
        where: {
          id: dto.replyToMessageId,
          conversationId: dto.conversationId,
          deletedAt: null,
        },
        select: { id: true, externalId: true },
      });

      if (!replyTarget) {
        throw new BadRequestException('Mensagem respondida nao encontrada');
      }

      replyTargetExternalId = replyTarget.externalId ?? null;
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

    // Salvar mensagem no banco com status "queued"
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderType: 'user',
        senderId: userId,
        type: dto.type ?? 'text',
        content: dto.content ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        mimeType: dto.mimeType ?? null,
        fileName: dto.fileName ?? null,
        fileSize: dto.fileSize ?? null,
        replyToMessageId: dto.replyToMessageId ?? null,
        interactiveType: dto.interactiveType ?? null,
        interactivePayload: dto.interactivePayload
          ? (JSON.parse(
              JSON.stringify(dto.interactivePayload),
            ) as Prisma.InputJsonValue)
          : undefined,
        status: 'queued' as any,
      },
    });
    const hydratedMessage = await this.getHydratedMessage(message.id);

    // Atualizar lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date(), unreadCount: 0 },
    });

    // Emitir pelo WebSocket imediatamente (status queued)
    this.eventsGateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId: dto.conversationId,
      message: hydratedMessage,
      unreadCount: 0,
    });

    // Enfileirar envio para o processor (fora do request síncrono)
    await this.outboundQueue.add(
      'send',
      {
        messageId: message.id,
        workspaceId,
        conversationId: dto.conversationId,
        whatsappAccountId: conversation.whatsappAccountId,
        toPhone: conversation.contact.phone,
        type: dto.type ?? 'text',
        content: dto.content ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        mimeType: dto.mimeType ?? null,
        fileName: dto.fileName ?? null,
        fileSize: dto.fileSize ?? null,
        replyToExternalId: replyTargetExternalId,
        interactiveType: dto.interactiveType ?? null,
        interactivePayload: dto.interactivePayload ?? null,
      },
      {
        attempts: 4,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
      },
    );

    return hydratedMessage;
  }

  async retry(messageId: string, workspaceId: string, permissions: string[] = []) {
    this.assertPermission(['respond_conversation'], permissions);

    const message = await this.prisma.message.findFirst({
      where: { id: messageId },
      include: { conversation: { include: { contact: true, whatsappAccount: true } } },
    });

    if (!message) throw new NotFoundException('Mensagem não encontrada');
    if (message.conversation.workspaceId !== workspaceId) {
      throw new NotFoundException('Mensagem não encontrada');
    }
    if (message.status !== 'failed') {
      throw new BadRequestException('Apenas mensagens com falha podem ser reenviadas');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'queued' as any, failureReason: null } as any,
    });

    await this.outboundQueue.add(
      'send',
      {
        messageId: message.id,
        workspaceId,
        conversationId: message.conversationId,
        whatsappAccountId: message.conversation.whatsappAccountId,
        toPhone: message.conversation.contact.phone,
        type: message.type,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mimeType: message.mimeType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        replyToExternalId: null,
        interactiveType: message.interactiveType,
        interactivePayload: message.interactivePayload as Record<string, unknown> | null,
      },
      {
        attempts: 4,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
      },
    );

    return this.getHydratedMessage(messageId);
  }

  async react(
    messageId: string,
    emoji: string,
    workspaceId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    this.assertPermission(['respond_conversation'], permissions);
    const scopedMessage = await this.getScopedMessage(
      messageId,
      workspaceId,
      userId,
      permissions,
    );

    const normalizedEmoji = emoji.trim();
    if (!normalizedEmoji) {
      throw new BadRequestException('Emoji obrigatorio');
    }

    const existing = this.parseReactions(scopedMessage.reactions);
    const withoutCurrentSender = existing.filter(
      (reaction) =>
        !(reaction.senderType === 'user' && reaction.senderId === userId),
    );
    const ownReaction = existing.find(
      (reaction) =>
        reaction.senderType === 'user' && reaction.senderId === userId,
    );

    const nextReactions =
      ownReaction?.emoji === normalizedEmoji
        ? withoutCurrentSender
        : [
            ...withoutCurrentSender,
            {
              emoji: normalizedEmoji,
              senderType: 'user',
              senderId: userId,
              createdAt: new Date().toISOString(),
            },
          ];

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        reactions: nextReactions.length
          ? (JSON.parse(JSON.stringify(nextReactions)) as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    const message = await this.getHydratedMessage(messageId);
    this.eventsGateway.emitToWorkspace(workspaceId, 'message_updated', {
      conversationId: scopedMessage.conversationId,
      message,
    });
    return message;
  }

  async remove(
    messageId: string,
    workspaceId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    this.assertPermission(['respond_conversation'], permissions);
    const scopedMessage = await this.getScopedMessage(
      messageId,
      workspaceId,
      userId,
      permissions,
    );

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        type: 'text',
        content: null,
        mediaUrl: null,
        mimeType: null,
        fileName: null,
        fileSize: null,
        metadata: Prisma.DbNull,
        reactions: Prisma.DbNull,
        replyToMessageId: null,
        interactiveType: null,
        interactivePayload: Prisma.DbNull,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    const message = await this.getHydratedMessage(messageId);
    this.eventsGateway.emitToWorkspace(workspaceId, 'message_updated', {
      conversationId: scopedMessage.conversationId,
      message,
    });
    return message;
  }

  private assertPermission(required: string[], permissions: string[]) {
    const hasAll = required.every((permission) =>
      permissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException('Permissão insuficiente');
    }
  }

  private async getScopedMessage(
    messageId: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
  ) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: { workspaceId },
      },
      include: {
        conversation: {
          select: {
            id: true,
            assignedUserId: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem nao encontrada');
    }

    const canViewAll = permissions.includes('view_all_conversations');
    if (!canViewAll && message.conversation.assignedUserId !== userId) {
      throw new ForbiddenException('Sem acesso a essa mensagem');
    }

    return {
      ...message,
      conversationId: message.conversation.id,
    };
  }

  private async getHydratedMessage(messageId: string) {
    return this.prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: {
        replyToMessage: {
          select: {
            id: true,
            type: true,
            content: true,
            mediaUrl: true,
            mimeType: true,
            fileName: true,
            metadata: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  private parseReactions(
    value: Prisma.JsonValue | null,
  ): MessageReactionRecord[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return [];
      }

      const record = entry as Record<string, unknown>;
      if (typeof record.emoji !== 'string') {
        return [];
      }

      return [
        {
          emoji: record.emoji,
          senderType:
            record.senderType === 'contact' || record.senderType === 'system'
              ? record.senderType
              : 'user',
          senderId:
            typeof record.senderId === 'string' ? record.senderId : null,
          createdAt:
            typeof record.createdAt === 'string'
              ? record.createdAt
              : new Date().toISOString(),
        },
      ];
    });
  }
}
