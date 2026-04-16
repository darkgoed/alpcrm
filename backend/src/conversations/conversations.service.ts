import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../gateway/events.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { InitiateConversationDto } from './dto/initiate-conversation.dto';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
    private audit: AuditService,
  ) {}

  // ─── Listar conversas do workspace ──────────────────────────────────────────

  async findAll(
    workspaceId: string,
    userId: string,
    permissions: string[],
    filters: {
      status?: ConversationStatus;
      teamId?: string;
      assignedUserId?: string;
    } = {},
  ) {
    const canViewAll = permissions.includes('view_all_conversations');

    return this.prisma.conversation.findMany({
      where: {
        workspaceId,
        // Operador comum só vê conversas atribuídas a ele
        ...(canViewAll ? {} : { assignedUserId: userId }),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.teamId ? { teamId: filters.teamId } : {}),
        ...(filters.assignedUserId
          ? { assignedUserId: filters.assignedUserId }
          : {}),
      },
      include: {
        contact: true,
        assignedUser: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Última mensagem para preview
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  // ─── Buscar uma conversa com todas as mensagens ──────────────────────────────

  async findOne(
    id: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: true,
        whatsappAccount: { select: { id: true, phoneNumber: true } },
        assignedUser: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const canViewAll = permissions.includes('view_all_conversations');
    if (!canViewAll && conversation.assignedUserId !== userId) {
      throw new ForbiddenException('Você não tem acesso a essa conversa');
    }

    return conversation;
  }

  // ─── Atribuir conversa ───────────────────────────────────────────────────────

  async assign(
    id: string,
    workspaceId: string,
    dto: AssignConversationDto,
    permissions: string[] = [],
    actorId?: string,
  ) {
    this.assertPermission(['assign_conversation'], permissions);
    await this.assertExists(id, workspaceId);
    const result = await this.prisma.conversation.update({
      where: { id },
      data: {
        assignedUserId: dto.userId ?? null,
        teamId: dto.teamId ?? null,
      },
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'assign',
      entity: 'conversation',
      entityId: id,
      metadata: { assignedUserId: dto.userId ?? null, teamId: dto.teamId ?? null },
    });
    return result;
  }

  // ─── Fechar conversa ────────────────────────────────────────────────────────

  async close(id: string, workspaceId: string, permissions: string[] = [], actorId?: string) {
    this.assertPermission(['close_conversation'], permissions);
    const conversation = await this.assertExists(id, workspaceId);

    const result = await this.prisma.$transaction(async (tx) => {
      const closedConversation = await tx.conversation.update({
        where: { id },
        data: { status: 'closed', isBotActive: false },
      });

      await tx.contactFlowState.updateMany({
        where: { contactId: conversation.contactId, isActive: true },
        data: {
          isActive: false,
          waitingForReply: false,
          replyTimeoutAt: null,
        },
      });

      return closedConversation;
    });

    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'close',
      entity: 'conversation',
      entityId: id,
    });

    return result;
  }

  // ─── Reabrir conversa ───────────────────────────────────────────────────────

  async reopen(id: string, workspaceId: string, permissions: string[] = [], actorId?: string) {
    this.assertPermission(['close_conversation'], permissions);
    await this.assertExists(id, workspaceId);
    const result = await this.prisma.conversation.update({
      where: { id },
      data: { status: 'open', isBotActive: true },
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'reopen',
      entity: 'conversation',
      entityId: id,
    });
    return result;
  }

  async remove(id: string, workspaceId: string, permissions: string[] = []) {
    this.assertPermission(['close_conversation'], permissions);
    await this.assertExists(id, workspaceId);

    await this.prisma.conversation.delete({
      where: { id },
    });

    this.eventsGateway.emitToWorkspace(workspaceId, 'conversation_deleted', {
      conversationId: id,
    });

    return { success: true };
  }

  async markAsRead(
    id: string,
    workspaceId: string,
    userId: string,
    permissions: string[],
  ) {
    const conversation = await this.findOne(
      id,
      workspaceId,
      userId,
      permissions,
    );

    if (conversation.unreadCount === 0) {
      return conversation;
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
      include: {
        contact: true,
        whatsappAccount: { select: { id: true, phoneNumber: true } },
        assignedUser: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    this.eventsGateway.emitToWorkspace(workspaceId, 'conversation_updated', {
      conversationId: id,
      conversation: updated,
    });

    return updated;
  }

  // ─── Adicionar nota interna ──────────────────────────────────────────────────

  async addNote(
    id: string,
    workspaceId: string,
    userId: string,
    content: string,
    permissions: string[] = [],
  ) {
    this.assertPermission(['manage_internal_notes'], permissions);
    if (!content?.trim())
      throw new BadRequestException('Conteúdo da nota é obrigatório');
    await this.assertExists(id, workspaceId);

    const note = await this.prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'system',
        senderId: userId,
        type: 'text',
        content: content.trim(),
        status: 'sent',
      },
    });

    this.eventsGateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId: id,
      message: note,
    });

    return note;
  }

  // ─── Iniciar conversa outbound via template HSM ──────────────────────────────

  async initiateConversation(
    dto: InitiateConversationDto,
    workspaceId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    this.assertPermission(['initiate_outbound_conversation'], permissions);
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id: dto.whatsappAccountId, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: dto.templateId, workspaceId },
    });
    if (!template) throw new NotFoundException('Template não encontrado');
    if (template.status !== 'APPROVED') {
      throw new BadRequestException('Template não aprovado pela Meta');
    }

    // Reutiliza conversa aberta; se nao houver, cria uma nova conversa
    // reaproveitando o contexto da ultima fechada quando existir.
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        workspaceId,
        whatsappAccountId: account.id,
        status: 'open',
      },
    });

    if (!conversation) {
      const lastClosedConversation = await this.prisma.conversation.findFirst({
        where: {
          contactId: contact.id,
          workspaceId,
          whatsappAccountId: account.id,
          status: 'closed',
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (lastClosedConversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            workspaceId,
            contactId: contact.id,
            whatsappAccountId: account.id,
            status: 'open',
            isBotActive: false,
            assignedUserId: lastClosedConversation.assignedUserId ?? userId,
            teamId: lastClosedConversation.teamId,
          },
        });

        this.eventsGateway.emitToWorkspace(
          workspaceId,
          'conversation_updated',
          {
            conversationId: conversation.id,
            conversation,
          },
        );
      } else {
        conversation = await this.prisma.conversation.create({
          data: {
            workspaceId,
            contactId: contact.id,
            whatsappAccountId: account.id,
            status: 'open',
            isBotActive: false,
            assignedUserId: userId,
          },
        });
      }
    }

    // Montar variáveis do template
    const components = this.buildTemplateComponents(template, dto);

    // Enviar template via WhatsApp
    let externalId = '';
    try {
      externalId = await this.whatsappService.sendTemplateMessage(
        account.id,
        contact.phone,
        template.name,
        template.language,
        components,
      );
    } catch {
      // salva mensagem como failed mesmo assim
    }

    // Salvar mensagem no banco
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        senderId: userId,
        type: 'text',
        content: template.body,
        status: externalId ? 'sent' : 'failed',
        externalId: externalId || null,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    this.eventsGateway.emitToWorkspace(workspaceId, 'new_message', {
      conversationId: conversation.id,
      message,
    });

    return { conversation, message };
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertExists(id: string, workspaceId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, workspaceId },
    });
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    return conv;
  }

  private assertPermission(required: string[], permissions: string[]) {
    const hasAll = required.every((permission) =>
      permissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException('Permissão insuficiente');
    }
  }

  private buildTemplateComponents(
    template: {
      headerFormat: string | null;
      buttons: Prisma.JsonValue | null;
    },
    dto: InitiateConversationDto,
  ) {
    const components: Record<string, unknown>[] = [];
    const bodyVariables = dto.variables ?? [];

    if (bodyVariables.length) {
      components.push({
        type: 'body',
        parameters: bodyVariables.map((value) => ({
          type: 'text',
          text: value,
        })),
      });
    }

    if (template.headerFormat === 'TEXT' && dto.headerVariables?.length) {
      components.push({
        type: 'header',
        parameters: dto.headerVariables.map((value) => ({
          type: 'text',
          text: value,
        })),
      });
    }

    if (
      template.headerFormat &&
      template.headerFormat !== 'TEXT' &&
      dto.headerMediaUrl
    ) {
      const mediaType = template.headerFormat.toLowerCase();
      components.push({
        type: 'header',
        parameters: [
          {
            type: mediaType,
            [mediaType]: { link: dto.headerMediaUrl },
          },
        ],
      });
    }

    const buttons = Array.isArray(template.buttons) ? template.buttons : [];
    buttons.forEach((button, index) => {
      if (!this.isRecord(button) || button.type !== 'URL') return;
      const value = dto.buttonVariables?.[index];
      if (!value) return;

      components.push({
        type: 'button',
        sub_type: 'url',
        index: String(index),
        parameters: [{ type: 'text', text: value }],
      });
    });

    return components;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
