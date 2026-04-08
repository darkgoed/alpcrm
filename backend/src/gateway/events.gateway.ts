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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private jwt: JwtService) {}

  // ─── Conexão ────────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify(token.replace('Bearer ', ''));
      client.data.workspaceId = payload.workspaceId;
      client.data.userId = payload.sub;

      // Entrar na sala do workspace automaticamente
      client.join(`workspace:${payload.workspaceId}`);
      this.logger.log(`Cliente conectado: ${client.id} (workspace: ${payload.workspaceId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ─── Entrar em sala de conversa ──────────────────────────────────────────────

  @SubscribeMessage('join_conversation')
  joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  // ─── Emissores (chamados pelos services) ────────────────────────────────────

  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
