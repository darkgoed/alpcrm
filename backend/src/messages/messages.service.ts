import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private eventsGateway: EventsGateway,
    private flowExecutor: FlowExecutorService,
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

  // ─── Enviar mensagem (operador → contato) ───────────────────────────────────

  async send(dto: SendMessageDto, workspaceId: string, userId: string, permissions: string[] = []) {
    if (!dto.content && !dto.mediaUrl) {
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
      throw new BadRequestException('Não é possível enviar mensagem em conversa fechada');
    }

    // ── Lock de conversa ──────────────────────────────────────────────────────
    // Apenas o operador atribuído pode responder.
    // Quem tem view_all_conversations (admin/supervisor) pode responder qualquer uma.
    const canViewAll = permissions.includes('view_all_conversations');
    if (!canViewAll && conversation.assignedUserId && conversation.assignedUserId !== userId) {
      throw new ForbiddenException('Conversa atribuída a outro operador');
    }

    // Parar bot se estiver ativo — operador assumiu
    if (conversation.isBotActive) {
      await this.flowExecutor.stopBotForConversation(dto.conversationId, conversation.contactId);
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
        status: 'sent',
      },
    });

    // Atualizar lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Emitir pelo WebSocket imediatamente
    this.eventsGateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId: dto.conversationId,
      message,
    });

    // Enviar pela API do WhatsApp (apenas texto por enquanto)
    if (dto.type === 'text' || !dto.type) {
      try {
        const externalId = await this.whatsappService.sendTextMessage(
          conversation.whatsappAccountId,
          conversation.contact.phone,
          dto.content!,
        );

        // Atualizar com o ID externo retornado pelo WhatsApp
        await this.prisma.message.update({
          where: { id: message.id },
          data: { externalId },
        });
      } catch (err) {
        // Marcar como falha mas não reverter — operador vê o erro no frontend
        await this.prisma.message.update({
          where: { id: message.id },
          data: { status: 'failed' },
        });
      }
    }

    return message;
  }
}
