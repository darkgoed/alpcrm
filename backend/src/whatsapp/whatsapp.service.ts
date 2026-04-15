import {
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SchedulerService } from '../queues/scheduler.service';
import {
  WhatsappWebhookPayload,
  WhatsappMessage,
  WhatsappContact,
  WhatsappStatus,
} from './dto/webhook.dto';
import { MessageType, MessageStatus, Prisma } from '@prisma/client';
import { isWithinBusinessHours } from '../common/utils/business-hours.util';
import { logMsg } from '../common/logger/app-logger.service';
import { WhatsappMetaClient } from './whatsapp-meta-client.service';

export type WebhookRealtimeEvent = {
  workspaceId: string;
  event: string;
} & Record<string, unknown>;

interface OutboundMediaPayload {
  link: string;
  caption?: string;
}

interface InteractiveButtonInput {
  id: string;
  title: string;
}

interface InteractiveListRowInput {
  id: string;
  title: string;
  description?: string;
}

interface InteractiveListSectionInput {
  title: string;
  rows: InteractiveListRowInput[];
}

interface InteractivePayloadInput {
  body?: string;
  footer?: string;
  headerText?: string;
  buttonText?: string;
  url?: string;
  buttons?: InteractiveButtonInput[];
  sections?: InteractiveListSectionInput[];
}

type NormalizedStructuredMessage = {
  messageType: MessageType;
  content: string | null;
  metadata: Prisma.InputJsonValue | null;
  metaMediaId: string | null;
  inboundMime: string | null;
  fileName: string | null;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(forwardRef(() => TeamsService))
    private teamsService: TeamsService,
    private flowExecutor: FlowExecutorService,
    private scheduler: SchedulerService,
    private metaClient: WhatsappMetaClient,
  ) {}

  private getPublicUploadsUrl(fileName: string) {
    const configuredBase = this.config.get<string>('API_BASE_URL')?.trim();
    const normalizedBase = configuredBase?.replace(/\/+$/, '');

    if (normalizedBase) {
      return `${normalizedBase}/api/uploads/${fileName}`;
    }

    return `/api/uploads/${fileName}`;
  }

  private resolveOutboundMediaUrl(mediaUrl: string) {
    const configuredBase = this.config.get<string>('API_BASE_URL')?.trim();
    const normalizedBase = configuredBase?.replace(/\/+$/, '');

    if (mediaUrl.startsWith('/')) {
      if (!normalizedBase) {
        return mediaUrl;
      }
      return new URL(mediaUrl, `${normalizedBase}/`).toString();
    }

    try {
      const parsed = new URL(mediaUrl);
      const isLocalhost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '0.0.0.0';

      if (isLocalhost && normalizedBase) {
        return new URL(
          parsed.pathname + parsed.search + parsed.hash,
          `${normalizedBase}/`,
        ).toString();
      }
    } catch {
      return mediaUrl;
    }

    return mediaUrl;
  }

  // ─── Verificação do webhook (GET) ───────────────────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.config.get<string>(
      'WHATSAPP_VERIFY_TOKEN',
      'crm_verify_token',
    );
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verificado com sucesso');
      return challenge;
    }
    throw new NotFoundException('Token de verificação inválido');
  }

  // ─── Processamento do webhook (POST) ────────────────────────────────────────

  async processWebhook(
    payload: WhatsappWebhookPayload,
    onMessage: (data: WebhookRealtimeEvent) => void,
  ) {
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
            this.logger.log(
              logMsg('[Webhook] Mensagem recebida', {
                phoneNumberId,
                from: msg.from,
                type: msg.type,
                externalId: msg.id,
              }),
            );
            try {
              await this.handleIncomingMessage(
                phoneNumberId,
                msg,
                contact,
                onMessage,
              );
            } catch (error) {
              const err = this.formatError(error);
              this.logger.error(
                logMsg('[Webhook] Falha ao processar mensagem', {
                  phoneNumberId,
                  from: msg.from,
                  externalId: msg.id,
                  reason: err.message,
                }),
                err.stack,
              );
            }
          }
        }

        // Processa atualizações de status
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            this.logger.log(
              logMsg('[Webhook] Status recebido', {
                externalId: status.id,
                status: status.status,
              }),
            );
            try {
              await this.handleStatusUpdate(status, onMessage);
            } catch (error) {
              const err = this.formatError(error);
              this.logger.error(
                logMsg('[Webhook] Falha ao processar status', {
                  externalId: status.id,
                  status: status.status,
                  reason: err.message,
                }),
                err.stack,
              );
            }
          }
        }
      }
    }
  }

  // ─── Mensagem recebida ───────────────────────────────────────────────────────

  private async claimWebhookReceipt(eventId: string, eventType: string): Promise<boolean> {
    try {
      await this.prisma.webhookReceipt.create({ data: { eventId, eventType } });
      return true;
    } catch {
      return false; // unique constraint — already processed
    }
  }

  private async handleIncomingMessage(
    phoneNumberId: string,
    msg: WhatsappMessage,
    waContact: WhatsappContact | undefined,
    onMessage: (data: any) => void,
  ) {
    // Idempotência: garantir que cada evento da Meta seja processado exatamente uma vez
    const claimed = await this.claimWebhookReceipt(msg.id, 'message');
    if (!claimed) {
      this.logger.warn(
        logMsg('[Webhook] Evento já processado (receipt)', { externalId: msg.id, type: 'message' }),
      );
      return;
    }

    // 1. Encontrar a conta WhatsApp pelo phone_number_id (meta_account_id)
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { metaAccountId: phoneNumberId, isActive: true },
    });

    if (!account) {
      this.logger.warn(
        `Nenhuma conta WhatsApp encontrada para phone_number_id: ${phoneNumberId}`,
      );
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
        source: 'whatsapp_inbound',
      },
    });

    // 3. Buscar conversa aberta; se nao houver, criar uma nova conversa
    // reaproveitando o contexto da ultima fechada quando existir.
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        workspaceId,
        contactId: contact.id,
        whatsappAccountId: account.id,
        status: 'open',
      },
    });

    let conversation = existingConversation;

    if (!conversation) {
      const lastClosedConversation = await this.prisma.conversation.findFirst({
        where: {
          workspaceId,
          contactId: contact.id,
          whatsappAccountId: account.id,
          status: 'closed',
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (lastClosedConversation) {
        const createdConversation = await this.prisma.conversation.create({
          data: {
            workspaceId,
            contactId: contact.id,
            whatsappAccountId: account.id,
            status: 'open',
            isBotActive: true,
            teamId: lastClosedConversation.teamId,
            assignedUserId: lastClosedConversation.assignedUserId,
          },
        });
        conversation = createdConversation;

        onMessage({
          event: 'conversation_updated',
          workspaceId,
          conversationId: conversation.id,
          conversation: await this.prisma.conversation.findUniqueOrThrow({
            where: { id: conversation.id },
            include: {
              contact: true,
              assignedUser: { select: { id: true, name: true } },
              team: { select: { id: true, name: true } },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          }),
        });
      } else {
        // Round-robin: buscar equipe padrão do workspace e distribuir para membro com menor carga
        const defaultTeam = await this.prisma.team.findFirst({
          where: { workspaceId },
        });
        let assignedUserId: string | null = null;
        let teamId: string | null = null;

        if (defaultTeam) {
          teamId = defaultTeam.id;
          assignedUserId = await this.teamsService.getNextMember(
            defaultTeam.id,
          );
          if (assignedUserId) {
            this.logger.log(
              `Conversa atribuída via round-robin ao usuário ${assignedUserId}`,
            );
          }
        }

        conversation = await this.prisma.conversation.create({
          data: {
            workspaceId,
            contactId: contact.id,
            whatsappAccountId: account.id,
            status: 'open',
            isBotActive: true,
            teamId,
            assignedUserId,
          },
        });
      }
    }

    // 4. Deduplicação: ignorar mensagem já processada (retry da Meta)
    const alreadyExists = await this.prisma.message.findFirst({
      where: { externalId: msg.id },
      select: { id: true },
    });
    if (alreadyExists) {
      this.logger.warn(
        `[Webhook] Mensagem duplicada ignorada externalId=${msg.id}`,
      );
      return;
    }

    // 5. Salvar mensagem
    const normalizedInteractive = this.normalizeInboundInteractiveMessage(msg);
    const normalizedStructured = this.normalizeStructuredMessage(msg);
    const messageType =
      normalizedStructured?.messageType ?? this.mapMessageType(msg.type);
    const content =
      normalizedInteractive?.content ??
      normalizedStructured?.content ??
      msg.text?.body ??
      msg.image?.caption ??
      msg.video?.caption ??
      null;

    // Baixar mídia inbound da Meta, se houver
    const metaMediaId = normalizedStructured?.metaMediaId ?? null;

    const inboundMime = normalizedStructured?.inboundMime ?? null;

    let mediaUrl: string | null = null;
    let mimeType: string | null = inboundMime;
    let fileName: string | null = normalizedStructured?.fileName ?? null;
    let fileSize: number | null = null;
    let replyToMessageId: string | null = null;

    if (metaMediaId) {
      const downloaded = await this.downloadAndSaveMedia(
        account.token,
        metaMediaId,
        inboundMime,
        msg.document?.filename,
      );
      if (downloaded) {
        mediaUrl = downloaded.url;
        mimeType = downloaded.mimeType;
        fileName = downloaded.fileName;
        fileSize = downloaded.fileSize;
      }
    }

    if (msg.context?.id) {
      const repliedMessage = await this.prisma.message.findFirst({
        where: { externalId: msg.context.id },
        select: { id: true },
      });
      replyToMessageId = repliedMessage?.id ?? null;
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'contact',
        senderId: contact.id,
        type: messageType,
        content,
        mediaUrl,
        mimeType,
        fileName,
        fileSize,
        metadata: normalizedStructured?.metadata ?? undefined,
        replyToMessageId,
        interactiveType: normalizedInteractive?.interactiveType ?? null,
        interactivePayload: normalizedInteractive?.interactivePayload,
        status: 'delivered',
        externalId: msg.id,
      },
    });
    const hydratedMessage = await this.prisma.message.findUniqueOrThrow({
      where: { id: message.id },
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

    // 6. Atualizar lastMessageAt e lastContactMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastContactMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(
      logMsg('[Webhook] Mensagem persistida', {
        workspaceId,
        conversationId: conversation.id,
        from: msg.from,
        externalId: msg.id,
      }),
    );

    // 6a. Agendar follow-up e auto-close (reinicia timers a cada mensagem do contato)
    this.scheduler
      .cancelFollowUps(conversation.id, workspaceId)
      .catch(() => null);
    this.scheduler
      .scheduleFollowUps(conversation.id, workspaceId, contact.id)
      .catch(() => null);
    this.scheduler
      .scheduleAutoClose(conversation.id, workspaceId)
      .catch(() => null);

    // 6b. Mensagem automática de fora de horário
    await this.sendOutOfHoursMessageIfNeeded(
      workspaceId,
      account.id,
      contact,
      conversation.id,
      onMessage,
    );

    // 7. Emitir evento para o WebSocket
    onMessage({
      event: 'new_message',
      workspaceId,
      conversationId: conversation.id,
      message: hydratedMessage,
      contact,
      unreadCount: (conversation.unreadCount ?? 0) + 1,
    });

    // 8. Retomar wait_for_reply ou disparar novo flow
    const isNewConv = !existingConversation;
    this.flowExecutor
      .resumeWaitingFlows(
        conversation.id,
        contact.id,
        content ?? '',
        (normalizedInteractive?.interactivePayload as
          | { replyId?: string | null; title?: string | null }
          | undefined) ?? null,
      )
      .then(() =>
        this.flowExecutor.triggerForConversation(
          conversation.id,
          workspaceId,
          contact.id,
          content,
          (normalizedInteractive?.interactivePayload as
            | { replyId?: string | null; title?: string | null }
            | undefined) ?? null,
          isNewConv,
        ),
      )
      .then(() =>
        this.logger.log(
          `[Flow] Processamento concluído conversation=${conversation.id} contact=${contact.id} inboundMessage=${msg.id}`,
        ),
      )
      .catch((err) => {
        const error = this.formatError(err);
        this.logger.error(
          `[Flow] Erro ao processar automação conversation=${conversation.id} contact=${contact.id} inboundMessage=${msg.id}: ${error.message}`,
          error.stack,
        );
      });
  }

  // ─── Atualização de status ───────────────────────────────────────────────────

  private async handleStatusUpdate(
    status: WhatsappStatus,
    onMessage: (data: WebhookRealtimeEvent) => void,
  ) {
    // Idempotência: status events para o mesmo externalId+status são deduplicados
    const receiptKey = `${status.id}:${status.status}`;
    const claimed = await this.claimWebhookReceipt(receiptKey, 'status');
    if (!claimed) {
      this.logger.warn(
        logMsg('[Webhook] Status duplicado ignorado', { externalId: status.id, status: status.status }),
      );
      return;
    }

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

    this.logger.log(
      logMsg('[Webhook] Status atualizado', {
        workspaceId: message.conversation.workspaceId,
        conversationId: message.conversationId,
        messageId: message.id,
        externalId: status.id,
        status: mapped,
      }),
    );
  }

  private formatError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack };
    }

    return { message: String(error) };
  }

  // ─── Horário comercial ───────────────────────────────────────────────────────

  private async sendOutOfHoursMessageIfNeeded(
    workspaceId: string,
    accountId: string,
    contact: { id: string; phone: string },
    conversationId: string,
    onMessage: (data: WebhookRealtimeEvent) => void,
  ): Promise<void> {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: { businessHours: true, timezone: true, outOfHoursMessage: true },
    });

    if (!settings?.outOfHoursMessage) return;

    const withinHours = isWithinBusinessHours(
      settings.businessHours as Record<
        string,
        { enabled: boolean; open: string; close: string }
      > | null,
      settings.timezone ?? 'America/Sao_Paulo',
    );

    if (withinHours) return;

    // Evitar envio repetido: pular se a última mensagem do sistema é a mesma
    const lastSystemMsg = await this.prisma.message.findFirst({
      where: { conversationId, senderType: 'system' },
      orderBy: { createdAt: 'desc' },
    });

    if (lastSystemMsg?.content === settings.outOfHoursMessage) return;

    try {
      const externalId = await this.sendTextMessage(
        accountId,
        contact.phone,
        settings.outOfHoursMessage,
      );

      const outOfHoursMsg = await this.prisma.message.create({
        data: {
          conversationId,
          senderType: 'system',
          type: 'text',
          content: settings.outOfHoursMessage,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      onMessage({
        event: 'new_message',
        workspaceId,
        conversationId,
        message: outOfHoursMsg,
        contact,
        unreadCount: 0,
      });

      this.logger.log(
        `[OutOfHours] Mensagem automática enviada para conversa ${conversationId}`,
      );
    } catch (err) {
      this.logger.warn(
        `[OutOfHours] Falha ao enviar mensagem automática: ${err}`,
      );
    }
  }

  // ─── Enviar mensagem pelo WhatsApp Cloud API ─────────────────────────────────

  async sendTextMessage(
    accountId: string,
    to: string,
    text: string,
    replyToExternalId?: string | null,
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    return this.metaClient.sendMessage(account.token, account.metaAccountId, {
      to,
      type: 'text',
      text: { body: text },
      ...(this.buildReplyContext(replyToExternalId) ?? {}),
    });
  }

  // ─── Enviar template HSM (outbound / janela de 24h) ─────────────────────────

  async sendTemplateMessage(
    accountId: string,
    to: string,
    templateName: string,
    language: string,
    components: Record<string, unknown>[],
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    return this.metaClient.sendMessage(account.token, account.metaAccountId, {
      to,
      type: 'template',
      template: { name: templateName, language: { code: language }, components },
    });
  }

  // ─── Enviar mídia ─────────────────────────────────────────────────────────────

  async sendMediaMessage(
    accountId: string,
    to: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string,
    replyToExternalId?: string | null,
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const mediaPayload: OutboundMediaPayload = {
      link: this.resolveOutboundMediaUrl(mediaUrl),
    };
    if (caption && (mediaType === 'image' || mediaType === 'document')) {
      mediaPayload.caption = caption;
    }

    return this.metaClient.sendMessage(account.token, account.metaAccountId, {
      to,
      type: mediaType,
      [mediaType]: mediaPayload,
      ...(this.buildReplyContext(replyToExternalId) ?? {}),
    });
  }

  async sendInteractiveMessage(
    accountId: string,
    to: string,
    interactiveType: string,
    payload: InteractivePayloadInput,
    replyToExternalId?: string | null,
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const interactive = this.buildInteractivePayload(interactiveType, payload);
    return this.metaClient.sendMessage(account.token, account.metaAccountId, {
      to,
      type: 'interactive',
      interactive,
      ...(this.buildReplyContext(replyToExternalId) ?? {}),
    });
  }

  // ─── Download de mídia inbound da Meta ───────────────────────────────────────

  private async downloadAndSaveMedia(
    token: string,
    mediaId: string,
    knownMime: string | null,
    knownFileName?: string | null,
  ): Promise<{
    url: string;
    mimeType: string;
    fileName: string;
    fileSize: number;
  } | null> {
    try {
      // 1. Buscar URL de download da Meta
      const info = await this.metaClient.getMediaInfo(token, mediaId);
      if (!info) return null;

      const downloadUrl: string = info.url;
      const mimeType: string =
        info.mime_type ?? knownMime ?? 'application/octet-stream';
      const fileSize: number = info.file_size ?? 0;

      // 2. Baixar o conteúdo binário
      const buffer = await this.metaClient.downloadMedia(token, downloadUrl);
      if (!buffer) return null;

      // 3. Determinar extensão e nome de arquivo
      const mimeExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'audio/ogg': 'ogg',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'video/mp4': 'mp4',
        'video/3gpp': '3gp',
        'application/pdf': 'pdf',
      };
      const ext =
        mimeExt[mimeType] ?? mimeType.split('/')[1]?.split(';')[0] ?? 'bin';
      const generatedName: string =
        knownFileName ?? `${crypto.randomUUID()}.${ext}`;
      const storedName: string = `${crypto.randomUUID()}${extname(generatedName) || `.${ext}`}`;

      // 4. Salvar em uploads/
      const uploadsDir = join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(join(uploadsDir, storedName), buffer);

      return {
        url: this.getPublicUploadsUrl(storedName),
        mimeType,
        fileName: generatedName,
        fileSize: fileSize || buffer.length,
      };
    } catch (err) {
      this.logger.error(`Erro ao baixar mídia ${mediaId}: ${err}`);
      return null;
    }
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private mapMessageType(type: string): MessageType {
    const map: Record<string, MessageType> = {
      text: 'text',
      image: 'image',
      audio: 'audio',
      video: 'video',
      document: 'document',
      sticker: 'sticker',
      location: 'location',
      contacts: 'contacts',
      interactive: 'interactive',
      button: 'interactive',
    };
    return map[type] ?? 'text';
  }

  private buildReplyContext(replyToExternalId?: string | null) {
    if (!replyToExternalId) {
      return null;
    }

    return {
      context: {
        message_id: replyToExternalId,
      },
    };
  }

  private normalizeStructuredMessage(
    msg: WhatsappMessage,
  ): NormalizedStructuredMessage | null {
    if (msg.type === 'sticker' && msg.sticker) {
      return {
        messageType: 'sticker',
        content: null,
        metadata: {
          sticker: {
            animated: msg.sticker.animated ?? false,
          },
        } as Prisma.InputJsonValue,
        metaMediaId: msg.sticker.id,
        inboundMime: msg.sticker.mime_type,
        fileName: null,
      };
    }

    if (msg.type === 'location' && msg.location) {
      const title =
        msg.location.name ??
        msg.location.address ??
        'Localizacao compartilhada';
      return {
        messageType: 'location',
        content: title,
        metadata: {
          location: {
            latitude: msg.location.latitude,
            longitude: msg.location.longitude,
            name: msg.location.name ?? null,
            address: msg.location.address ?? null,
            url: msg.location.url ?? null,
          },
        } as Prisma.InputJsonValue,
        metaMediaId: null,
        inboundMime: null,
        fileName: null,
      };
    }

    if (msg.type === 'contacts' && Array.isArray(msg.contacts)) {
      const contacts = msg.contacts.map((contact) => {
        const phones = (contact.phones ?? [])
          .map((phone) => phone.phone ?? phone.wa_id ?? null)
          .filter((phone): phone is string => Boolean(phone));
        const emails = (contact.emails ?? [])
          .map((email) => email.email ?? null)
          .filter((email): email is string => Boolean(email));
        const formattedName =
          contact.name?.formatted_name ??
          [contact.name?.first_name, contact.name?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();

        return {
          name: formattedName || phones[0] || 'Contato compartilhado',
          formattedName: formattedName || null,
          phones,
          emails,
          organization: contact.org?.company ?? null,
        };
      });

      return {
        messageType: 'contacts',
        content:
          contacts.length === 1
            ? contacts[0].name
            : `${contacts.length} contatos compartilhados`,
        metadata: {
          contacts,
        } as Prisma.InputJsonValue,
        metaMediaId: null,
        inboundMime: null,
        fileName: null,
      };
    }

    return {
      messageType: this.mapMessageType(msg.type),
      content: null,
      metadata: null,
      metaMediaId:
        msg.image?.id ??
        msg.audio?.id ??
        msg.video?.id ??
        msg.document?.id ??
        null,
      inboundMime:
        msg.image?.mime_type ??
        msg.audio?.mime_type ??
        msg.video?.mime_type ??
        msg.document?.mime_type ??
        null,
      fileName: msg.document?.filename ?? null,
    };
  }

  private normalizeInboundInteractiveMessage(msg: WhatsappMessage): {
    content: string | null;
    interactiveType: string;
    interactivePayload: Prisma.InputJsonValue;
  } | null {
    if (msg.type === 'button' && msg.button) {
      return {
        content: msg.button.text,
        interactiveType: 'button_reply',
        interactivePayload: {
          replyId: msg.button.payload ?? msg.button.text,
          title: msg.button.text,
        },
      };
    }

    if (msg.type !== 'interactive' || !msg.interactive) {
      return null;
    }

    if (
      msg.interactive.type === 'button_reply' &&
      msg.interactive.button_reply
    ) {
      return {
        content: msg.interactive.button_reply.title,
        interactiveType: 'button_reply',
        interactivePayload: {
          replyId: msg.interactive.button_reply.id,
          title: msg.interactive.button_reply.title,
        },
      };
    }

    if (msg.interactive.type === 'list_reply' && msg.interactive.list_reply) {
      return {
        content: msg.interactive.list_reply.title,
        interactiveType: 'list_reply',
        interactivePayload: {
          replyId: msg.interactive.list_reply.id,
          title: msg.interactive.list_reply.title,
          description: msg.interactive.list_reply.description ?? null,
        },
      };
    }

    return {
      content: null,
      interactiveType: msg.interactive.type,
      interactivePayload: JSON.parse(
        JSON.stringify(msg.interactive),
      ) as Prisma.InputJsonValue,
    };
  }

  private buildInteractivePayload(
    interactiveType: string,
    payload: InteractivePayloadInput,
  ) {
    if (interactiveType === 'reply_buttons') {
      const buttons = Array.isArray(payload.buttons) ? payload.buttons : [];
      if (!payload.body || buttons.length === 0) {
        throw new Error('Reply buttons exigem body e ao menos um botão');
      }

      return {
        type: 'button',
        ...(payload.headerText
          ? { header: { type: 'text', text: payload.headerText } }
          : {}),
        body: { text: payload.body },
        ...(payload.footer ? { footer: { text: payload.footer } } : {}),
        action: {
          buttons: buttons.slice(0, 3).map((button) => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      };
    }

    if (interactiveType === 'list') {
      const sections = Array.isArray(payload.sections) ? payload.sections : [];
      if (!payload.body || !payload.buttonText || sections.length === 0) {
        throw new Error('List message exige body, buttonText e sections');
      }

      return {
        type: 'list',
        ...(payload.headerText
          ? { header: { type: 'text', text: payload.headerText } }
          : {}),
        body: { text: payload.body },
        ...(payload.footer ? { footer: { text: payload.footer } } : {}),
        action: {
          button: payload.buttonText,
          sections: sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              ...(row.description ? { description: row.description } : {}),
            })),
          })),
        },
      };
    }

    if (interactiveType === 'cta_url') {
      if (!payload.body || !payload.buttonText || !payload.url) {
        throw new Error('CTA URL exige body, buttonText e url');
      }

      return {
        type: 'cta_url',
        ...(payload.headerText
          ? { header: { type: 'text', text: payload.headerText } }
          : {}),
        body: { text: payload.body },
        ...(payload.footer ? { footer: { text: payload.footer } } : {}),
        action: {
          name: 'cta_url',
          parameters: {
            display_text: payload.buttonText,
            url: payload.url,
          },
        },
      };
    }

    throw new Error(`Tipo interativo não suportado: ${interactiveType}`);
  }
}
