import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

type SocketData = {
  workspaceId?: string;
  userId?: string;
};

type EventsSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

const wsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

@WebSocketGateway({
  cors: { origin: wsOrigin, credentials: true },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly conversationPresence = new Map<
    string,
    Map<string, Set<string>>
  >();
  private readonly socketConversations = new Map<string, Set<string>>();

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  // ─── Conexão ────────────────────────────────────────────────────────────────

  handleConnection(client: EventsSocket) {
    const authToken = this.getRecordString(
      client.handshake.auth as unknown,
      'token',
    );
    const headerToken = client.handshake.headers.authorization;
    const token =
      typeof authToken === 'string'
        ? authToken
        : typeof headerToken === 'string'
          ? headerToken
          : null;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token.replace('Bearer ', ''));
      client.data.workspaceId = payload.workspaceId;
      client.data.userId = payload.sub;

      // Entrar na sala do workspace automaticamente
      void client.join(`workspace:${payload.workspaceId}`);
      this.logger.log(
        `Cliente conectado: ${client.id} (workspace: ${payload.workspaceId})`,
      );
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: EventsSocket) {
    this.removeSocketFromPresence(client);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ─── Entrar em sala de conversa ──────────────────────────────────────────────

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: EventsSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (
      !data?.conversationId ||
      !client.data.workspaceId ||
      !client.data.userId
    ) {
      return;
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        workspaceId: client.data.workspaceId,
      },
      select: { id: true },
    });

    if (!conversation) {
      this.logger.warn(
        `Acesso negado a sala de conversa ${data.conversationId} para user ${client.data.userId} no workspace ${client.data.workspaceId}`,
      );
      return;
    }

    void client.join(`conversation:${data.conversationId}`);
    this.addPresence(data.conversationId, client.data.userId, client.id);
    this.emitConversationPresence(data.conversationId);
  }

  @SubscribeMessage('leave_conversation')
  leaveConversation(
    @ConnectedSocket() client: EventsSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId || !client.data.userId) {
      return;
    }

    void client.leave(`conversation:${data.conversationId}`);
    this.removePresence(data.conversationId, client.data.userId, client.id);
    this.emitConversationPresence(data.conversationId);
  }

  // ─── Emissores (chamados pelos services) ────────────────────────────────────

  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  getActiveOperatorIds(conversationId: string) {
    const conversationUsers = this.conversationPresence.get(conversationId);
    if (!conversationUsers) return [];

    return Array.from(conversationUsers.keys());
  }

  private addPresence(
    conversationId: string,
    userId: string,
    socketId: string,
  ) {
    const conversationUsers =
      this.conversationPresence.get(conversationId) ??
      new Map<string, Set<string>>();
    const userSockets = conversationUsers.get(userId) ?? new Set<string>();

    userSockets.add(socketId);
    conversationUsers.set(userId, userSockets);
    this.conversationPresence.set(conversationId, conversationUsers);

    const joinedConversations =
      this.socketConversations.get(socketId) ?? new Set<string>();
    joinedConversations.add(conversationId);
    this.socketConversations.set(socketId, joinedConversations);
  }

  private removePresence(
    conversationId: string,
    userId: string,
    socketId: string,
  ) {
    const conversationUsers = this.conversationPresence.get(conversationId);
    if (!conversationUsers) return;

    const userSockets = conversationUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        conversationUsers.delete(userId);
      }
    }

    if (conversationUsers.size === 0) {
      this.conversationPresence.delete(conversationId);
    }

    const joinedConversations = this.socketConversations.get(socketId);
    if (joinedConversations) {
      joinedConversations.delete(conversationId);
      if (joinedConversations.size === 0) {
        this.socketConversations.delete(socketId);
      }
    }
  }

  private removeSocketFromPresence(client: EventsSocket) {
    const joinedConversations = this.socketConversations.get(client.id);
    if (!joinedConversations || !client.data.userId) return;

    for (const conversationId of joinedConversations) {
      this.removePresence(conversationId, client.data.userId, client.id);
      this.emitConversationPresence(conversationId);
    }
  }

  private emitConversationPresence(conversationId: string) {
    const conversationUsers = this.conversationPresence.get(conversationId);
    const operators = conversationUsers
      ? Array.from(conversationUsers.entries()).map(([userId, sockets]) => ({
          userId,
          connections: sockets.size,
        }))
      : [];

    this.emitToConversation(conversationId, 'conversation_presence', {
      conversationId,
      operators,
    });
  }

  private getRecordString(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    return typeof record[key] === 'string' ? record[key] : undefined;
  }
}
