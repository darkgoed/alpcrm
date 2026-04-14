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

interface WhatsappSendResponse {
  messages?: Array<{ id?: string }>;
}

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
  ) {}

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
    onMessage: (data: any) => void,
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
            await this.handleIncomingMessage(
              phoneNumberId,
              msg,
              contact,
              onMessage,
            );
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

    // 3. Buscar ou criar conversa ativa
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
      // Round-robin: buscar equipe padrão do workspace e distribuir para membro com menor carga
      const defaultTeam = await this.prisma.team.findFirst({
        where: { workspaceId },
      });
      let assignedUserId: string | null = null;
      let teamId: string | null = null;

      if (defaultTeam) {
        teamId = defaultTeam.id;
        assignedUserId = await this.teamsService.getNextMember(defaultTeam.id);
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

    // 4. Salvar mensagem
    const normalizedInteractive = this.normalizeInboundInteractiveMessage(msg);
    const messageType = this.mapMessageType(msg.type);
    const content =
      normalizedInteractive?.content ??
      msg.text?.body ??
      msg.image?.caption ??
      msg.video?.caption ??
      null;

    // Baixar mídia inbound da Meta, se houver
    const metaMediaId =
      msg.image?.id ??
      msg.audio?.id ??
      msg.video?.id ??
      msg.document?.id ??
      null;

    const inboundMime =
      msg.image?.mime_type ??
      msg.audio?.mime_type ??
      msg.video?.mime_type ??
      msg.document?.mime_type ??
      null;

    let mediaUrl: string | null = null;
    let mimeType: string | null = inboundMime;
    let fileName: string | null = msg.document?.filename ?? null;
    let fileSize: number | null = null;

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
        interactiveType: normalizedInteractive?.interactiveType ?? null,
        interactivePayload: normalizedInteractive?.interactivePayload,
        status: 'delivered',
        externalId: msg.id,
      },
    });

    // 5. Atualizar lastMessageAt e lastContactMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastContactMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(
      `Mensagem recebida de ${msg.from} → conversa ${conversation.id}`,
    );

    // 5a. Agendar follow-up e auto-close (reinicia timers a cada mensagem do contato)
    this.scheduler
      .cancelFollowUps(conversation.id, workspaceId)
      .catch(() => null);
    this.scheduler
      .scheduleFollowUps(conversation.id, workspaceId, contact.id)
      .catch(() => null);
    this.scheduler
      .scheduleAutoClose(conversation.id, workspaceId)
      .catch(() => null);

    // 5b. Mensagem automática de fora de horário
    await this.sendOutOfHoursMessageIfNeeded(
      workspaceId,
      account.id,
      contact,
      conversation.id,
      onMessage,
    );

    // 6. Emitir evento para o WebSocket
    onMessage({
      event: 'new_message',
      workspaceId,
      conversationId: conversation.id,
      message,
      contact,
      unreadCount: (conversation.unreadCount ?? 0) + 1,
    });

    // 7. Retomar wait_for_reply ou disparar novo flow
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
          ((normalizedInteractive?.interactivePayload as
            | { replyId?: string | null; title?: string | null }
            | undefined) ?? null),
          isNewConv,
        ),
      )
      .catch((err) =>
        this.logger.error(`[Bot] Erro ao processar flow: ${err}`),
      );
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

  // ─── Horário comercial ───────────────────────────────────────────────────────

  private async sendOutOfHoursMessageIfNeeded(
    workspaceId: string,
    accountId: string,
    contact: { id: string; phone: string },
    conversationId: string,
    onMessage: (data: any) => void,
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
  ): Promise<string> {
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

    return this.extractMessageId(response);
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
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Erro ao enviar template: ${err}`);
      throw new Error(`WhatsApp API error: ${err}`);
    }

    return this.extractMessageId(response);
  }

  // ─── Enviar mídia ─────────────────────────────────────────────────────────────

  async sendMediaMessage(
    accountId: string,
    to: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string,
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
    const mediaPayload: OutboundMediaPayload = { link: mediaUrl };
    if (caption && (mediaType === 'image' || mediaType === 'document')) {
      mediaPayload.caption = caption;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: mediaType,
        [mediaType]: mediaPayload,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Erro ao enviar mídia: ${err}`);
      throw new Error(`WhatsApp API error: ${err}`);
    }

    return this.extractMessageId(response);
  }

  async sendInteractiveMessage(
    accountId: string,
    to: string,
    interactiveType: string,
    payload: InteractivePayloadInput,
  ): Promise<string> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const interactive = this.buildInteractivePayload(interactiveType, payload);
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
        type: 'interactive',
        interactive,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Erro ao enviar mensagem interativa: ${err}`);
      throw new Error(`WhatsApp API error: ${err}`);
    }

    return this.extractMessageId(response);
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
      const infoRes = await fetch(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!infoRes.ok) return null;
      const info = (await infoRes.json()) as {
        url: string;
        mime_type?: string;
        file_size?: number;
      };

      const downloadUrl: string = info.url;
      const mimeType: string =
        info.mime_type ?? knownMime ?? 'application/octet-stream';
      const fileSize: number = info.file_size ?? 0;

      // 2. Baixar o conteúdo binário
      const mediaRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!mediaRes.ok) return null;

      // 3. Determinar extensão e nome de arquivo
      const mimeExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
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
      const buffer = Buffer.from(await mediaRes.arrayBuffer());
      await fs.writeFile(join(uploadsDir, storedName), buffer);

      const apiBase = this.config.get<string>(
        'API_BASE_URL',
        'http://localhost:3000',
      );
      return {
        url: `${apiBase}/api/uploads/${storedName}`,
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
      interactive: 'interactive',
      button: 'interactive',
    };
    return map[type] ?? 'text';
  }

  private async extractMessageId(response: Response): Promise<string> {
    const data = (await response.json()) as WhatsappSendResponse;
    return data.messages?.[0]?.id ?? '';
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
