import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  WhatsappWebhookPayload,
  WhatsappMessage,
  WhatsappContact,
  WhatsappStatus,
} from './dto/webhook.dto';
import { MessageType, MessageStatus } from '@prisma/client';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── Verificação do webhook (GET) ───────────────────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN', 'crm_verify_token');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verificado com sucesso');
      return challenge;
    }
    throw new NotFoundException('Token de verificação inválido');
  }

  // ─── Processamento do webhook (POST) ────────────────────────────────────────

  async processWebhook(payload: WhatsappWebhookPayload, onMessage: (data: any) => void) {
    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const { value } = change;
        const phoneNumberId = value.metadata.phone_number_id;

        // Processa mensagens recebidas
        if (value.messages?.length) {
          const contacts = value.contacts ?? [];
          for (const msg of value.messages) {
            const contact = contacts.find((c) => c.wa_id === msg.from);
            await this.handleIncomingMessage(phoneNumberId, msg, contact, onMessage);
          }
        }

        // Processa atualizações de status
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            await this.handleStatusUpdate(status, onMessage);
          }
        }
      }
    }
  }

  // ─── Mensagem recebida ───────────────────────────────────────────────────────

  private async handleIncomingMessage(
    phoneNumberId: string,
    msg: WhatsappMessage,
    waContact: WhatsappContact | undefined,
    onMessage: (data: any) => void,
  ) {
    // 1. Encontrar a conta WhatsApp pelo phone_number_id (meta_account_id)
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { metaAccountId: phoneNumberId, isActive: true },
    });

    if (!account) {
      this.logger.warn(`Nenhuma conta WhatsApp encontrada para phone_number_id: ${phoneNumberId}`);
      return;
    }

    const { workspaceId } = account;

    // 2. Buscar ou criar contato
    const contact = await this.prisma.contact.upsert({
      where: { workspaceId_phone: { workspaceId, phone: msg.from } },
      update: waContact?.profile.name ? { name: waContact.profile.name } : {},
      create: {
        workspaceId,
        phone: msg.from,
        name: waContact?.profile.name ?? msg.from,
      },
    });

    // 3. Buscar ou criar conversa ativa
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        workspaceId,
        contactId: contact.id,
        whatsappAccountId: account.id,
        status: 'open',
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          whatsappAccountId: account.id,
          status: 'open',
          isBotActive: true,
        },
      });
    }

    // 4. Salvar mensagem
    const messageType = this.mapMessageType(msg.type);
    const content = msg.text?.body ?? msg.document?.filename ?? null;
    const mediaId = msg.image?.id ?? msg.audio?.id ?? msg.video?.id ?? msg.document?.id ?? null;

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'contact',
        senderId: contact.id,
        type: messageType,
        content,
        mediaUrl: mediaId ? `media:${mediaId}` : null,
        status: 'delivered',
        externalId: msg.id,
      },
    });

    // 5. Atualizar lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    this.logger.log(`Mensagem recebida de ${msg.from} → conversa ${conversation.id}`);

    // 6. Emitir evento para o WebSocket
    onMessage({
      event: 'new_message',
      workspaceId,
      conversationId: conversation.id,
      message,
      contact,
    });
  }

  // ─── Atualização de status ───────────────────────────────────────────────────

  private async handleStatusUpdate(
    status: WhatsappStatus,
    onMessage: (data: any) => void,
  ) {
    const statusMap: Record<string, MessageStatus> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    };

    const mapped = statusMap[status.status];
    if (!mapped) return;

    const message = await this.prisma.message.findFirst({
      where: { externalId: status.id },
      include: { conversation: true },
    });

    if (!message) return;

    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: mapped },
    });

    onMessage({
      event: 'message_status',
      workspaceId: message.conversation.workspaceId,
      conversationId: message.conversationId,
      messageId: message.id,
      status: mapped,
    });
  }

  // ─── Enviar mensagem pelo WhatsApp Cloud API ─────────────────────────────────

  async sendTextMessage(accountId: string, to: string, text: string): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Erro ao enviar mensagem: ${err}`);
      throw new Error(`WhatsApp API error: ${err}`);
    }

    const data: any = await response.json();
    return data.messages?.[0]?.id ?? '';
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private mapMessageType(type: string): MessageType {
    const map: Record<string, MessageType> = {
      text: 'text',
      image: 'image',
      audio: 'audio',
      video: 'video',
      document: 'document',
    };
    return map[type] ?? 'text';
  }
}
