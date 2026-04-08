import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

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
        ...(filters.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
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

  async findOne(id: string, workspaceId: string, userId: string, permissions: string[]) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: true,
        whatsappAccount: { select: { id: true, phoneNumber: true } },
        assignedUser: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } },
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

  async assign(id: string, workspaceId: string, dto: AssignConversationDto) {
    await this.assertExists(id, workspaceId);
    return this.prisma.conversation.update({
      where: { id },
      data: {
        assignedUserId: dto.userId ?? null,
        teamId: dto.teamId ?? null,
      },
    });
  }

  // ─── Fechar conversa ────────────────────────────────────────────────────────

  async close(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'closed', isBotActive: false },
    });
  }

  // ─── Reabrir conversa ───────────────────────────────────────────────────────

  async reopen(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'open', isBotActive: true },
    });
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertExists(id: string, workspaceId: string) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, workspaceId } });
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    return conv;
  }
}
