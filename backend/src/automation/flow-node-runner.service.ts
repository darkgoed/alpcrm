import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../queues/scheduler.service';
import {
  interpolate,
  evaluateCondition,
  stringValue,
} from './flow-variable.util';
import { isWithinBusinessHours } from '../common/utils/business-hours.util';
import { EncryptionService } from '../common/services/encryption.service';

const MAX_INTERACTIVE_LIST_ROWS = 10;

type WhatsAppSendResponse = {
  error?: {
    message?: string;
    error_user_msg?: string;
  };
  messages?: Array<{ id?: string }>;
};

export interface NodeContext {
  nodeId: string;
  conversationId: string;
  contactId: string;
  flowId: string;
  variables: Record<string, string>;
}

export type NodeResult =
  | { kind: 'next'; nodeId: string | null }
  | { kind: 'branch'; label: string }
  | { kind: 'waiting' }
  | { kind: 'done' };

@Injectable()
export class FlowNodeRunnerService {
  private readonly logger = new Logger(FlowNodeRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerService,
    private readonly encryption: EncryptionService,
  ) {}

  async run(ctx: NodeContext): Promise<NodeResult> {
    const node = await this.prisma.flowNode.findUnique({
      where: { id: ctx.nodeId },
    });
    if (!node) return { kind: 'done' };

    this.logger.log(
      `[FlowNode] Executando flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId} type=${node.type}`,
    );

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: ctx.conversationId },
      include: { contact: true, whatsappAccount: true },
    });
    if (!conversation || !conversation.isBotActive) {
      this.logger.warn(
        `[FlowNode] Execução interrompida flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId} reason=conversation_not_available_or_bot_inactive`,
      );
      return { kind: 'done' };
    }

    const config = node.config as Record<string, unknown>;

    await this.prisma.flowExecutionLog.create({
      data: {
        flowId: ctx.flowId,
        contactId: ctx.contactId,
        nodeId: ctx.nodeId,
        event: 'node_executed',
        detail: { type: node.type },
      },
    });

    switch (node.type) {
      case 'message':
        return this.handleMessage(ctx, conversation, config);
      case 'finalize':
        return this.handleFinalize(ctx);
      case 'delay':
        return this.handleDelay(ctx, node, config);
      case 'wait_for_reply':
        return this.handleWaitForReply(ctx, config);
      case 'condition':
      case 'branch':
        return this.handleBranch(ctx, config);
      case 'tag_contact':
        return this.handleTagContact(ctx, conversation.workspaceId, config);
      case 'move_stage':
        return this.handleMoveStage(ctx, conversation.workspaceId, config);
      case 'assign_to':
        return this.handleAssignTo(ctx, config);
      case 'send_template':
        return this.handleSendTemplate(ctx, conversation, config);
      case 'send_interactive':
        return this.handleSendInteractive(ctx, conversation, config);
      case 'webhook_call':
        return this.handleWebhookCall(ctx, config);
      default:
        return { kind: 'next', nodeId: null };
    }
  }

  // ─── message ──────────────────────────────────────────────────────────────

  private async handleMessage(
    ctx: NodeContext,
    conversation: {
      id: string;
      workspaceId: string;
      whatsappAccountId: string;
      contact: { phone: string };
    },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const wsSettings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId: conversation.workspaceId },
      select: { businessHours: true, timezone: true },
    });

    if (
      wsSettings?.businessHours &&
      !isWithinBusinessHours(
        wsSettings.businessHours as Record<
          string,
          { enabled: boolean; open: string; close: string }
        >,
        wsSettings.timezone ?? 'America/Sao_Paulo',
      )
    ) {
      this.logger.log(
        `[FlowNode] Fora do horário comercial flow=${ctx.flowId} conversation=${ctx.conversationId} node=${ctx.nodeId} - message ignorada`,
      );
      return { kind: 'next', nodeId: null };
    }

    const text = interpolate(stringValue(config.content), ctx.variables);
    const imageUrl = interpolate(
      stringValue(config.imageUrl),
      ctx.variables,
    ).trim();

    if (!text && !imageUrl) {
      return { kind: 'next', nodeId: null };
    }

    try {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: conversation.whatsappAccountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

      const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.encryption.decrypt(account.token)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          imageUrl
            ? {
                messaging_product: 'whatsapp',
                to: conversation.contact.phone,
                type: 'image',
                image: {
                  link: imageUrl,
                  ...(text ? { caption: text } : {}),
                },
              }
            : {
                messaging_product: 'whatsapp',
                to: conversation.contact.phone,
                type: 'text',
                text: { body: text },
              },
        ),
      });
      const externalId = await this.extractExternalMessageId(res);

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: imageUrl ? 'image' : 'text',
          content: text || null,
          mediaUrl: imageUrl || null,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (err) {
      const error = this.formatError(err);
      this.logger.error(
        `[FlowNode] Falha ao enviar mensagem flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId}: ${error.message}`,
        error.stack,
      );
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── delay ────────────────────────────────────────────────────────────────

  private async handleFinalize(ctx: NodeContext): Promise<NodeResult> {
    await this.prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { status: 'closed', isBotActive: false },
    });

    this.logger.log(
      `[FlowNode] Conversa finalizada flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId}`,
    );

    return { kind: 'done' };
  }

  private async handleDelay(
    ctx: NodeContext,
    node: { id: string; nextId: string | null },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const ms = Number(config.ms ?? 1000);

    // Resolve próximo nó para agendar via fila (suporta edges e nextId)
    const nextNodeId =
      (await this.resolveEdgeTarget(node.id, null)) ?? node.nextId;
    if (nextNodeId) {
      await this.scheduler.scheduleFlowDelay(
        ms,
        nextNodeId,
        ctx.conversationId,
        ctx.contactId,
        ctx.flowId,
      );
    }

    // Retorna 'done' para interromper a execução síncrona — o queue retoma
    return { kind: 'done' };
  }

  // ─── wait_for_reply ───────────────────────────────────────────────────────

  private async handleWaitForReply(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const timeoutMs = config.timeoutMs ? Number(config.timeoutMs) : null;
    const timeoutAt = timeoutMs ? new Date(Date.now() + timeoutMs) : null;

    await this.prisma.contactFlowState.update({
      where: {
        contactId_flowId: { contactId: ctx.contactId, flowId: ctx.flowId },
      },
      data: {
        waitingForReply: true,
        replyTimeoutAt: timeoutAt,
      },
    });

    await this.prisma.flowExecutionLog.create({
      data: {
        flowId: ctx.flowId,
        contactId: ctx.contactId,
        nodeId: ctx.nodeId,
        event: 'waiting',
        detail: { timeoutAt },
      },
    });

    // Agenda timeout se configurado
    if (timeoutMs) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: ctx.conversationId },
        select: { id: true },
      });
      if (conversation) {
        await this.scheduler.scheduleReplyTimeout(
          timeoutMs,
          ctx.contactId,
          ctx.flowId,
          ctx.conversationId,
          ctx.nodeId,
        );
      }
    }

    return { kind: 'waiting' };
  }

  // ─── send_interactive ─────────────────────────────────────────────────────────

  private async handleSendInteractive(
    ctx: NodeContext,
    conversation: {
      id: string;
      whatsappAccountId: string;
      contact: { phone: string };
    },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const interactiveType = stringValue(config.interactiveType, 'button');
    const body = interpolate(stringValue(config.body), ctx.variables);
    const footer = config.footer
      ? interpolate(stringValue(config.footer), ctx.variables)
      : undefined;
    const timeoutMs = config.timeoutMs ? Number(config.timeoutMs) : null;
    const timeoutAt = timeoutMs ? new Date(Date.now() + timeoutMs) : null;

    let action: Record<string, unknown>;

    if (interactiveType === 'list') {
      const sections = Array.isArray(config.sections) ? config.sections : [];
      const totalRows = this.countInteractiveListRows(sections);
      if (totalRows > MAX_INTERACTIVE_LIST_ROWS) {
        throw new Error(
          `Lista interativa excede o limite de ${MAX_INTERACTIVE_LIST_ROWS} opções (recebido: ${totalRows})`,
        );
      }

      action = {
        button: interpolate(
          stringValue(config.buttonText, 'Ver opções'),
          ctx.variables,
        ),
        sections,
      };
    } else {
      const buttons = (
        (config.buttons as Array<{ id: string; title: string }>) ?? []
      ).slice(0, 3);
      action = {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: interpolate(b.title, ctx.variables) },
        })),
      };
    }

    const interactive: Record<string, unknown> = {
      type: interactiveType,
      body: { text: body },
      action,
    };
    if (footer) interactive.footer = { text: footer };
    let sent = false;

    try {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: conversation.whatsappAccountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

      const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.encryption.decrypt(account.token)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.contact.phone,
          type: 'interactive',
          interactive,
        }),
      });
      const externalId = await this.extractExternalMessageId(res);

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: 'interactive',
          content: body,
          interactiveType,
          interactivePayload: interactive as never,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { lastMessageAt: new Date() },
      });
      sent = true;
    } catch (err) {
      const error = this.formatError(err);
      this.logger.error(
        `[FlowNode] Falha ao enviar interactive flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId}: ${error.message}`,
        error.stack,
      );
    }

    if (!sent) {
      this.logger.warn(
        `[FlowNode] Interactive não enviado flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId}`,
      );
      return { kind: 'done' };
    }

    await this.prisma.contactFlowState.update({
      where: {
        contactId_flowId: { contactId: ctx.contactId, flowId: ctx.flowId },
      },
      data: {
        waitingForReply: true,
        replyTimeoutAt: timeoutAt,
      },
    });

    await this.prisma.flowExecutionLog.create({
      data: {
        flowId: ctx.flowId,
        contactId: ctx.contactId,
        nodeId: ctx.nodeId,
        event: 'waiting',
        detail: { timeoutAt, interactiveType },
      },
    });

    if (timeoutMs) {
      await this.scheduler.scheduleReplyTimeout(
        timeoutMs,
        ctx.contactId,
        ctx.flowId,
        ctx.conversationId,
        ctx.nodeId,
      );
    }

    return { kind: 'waiting' };
  }

  // ─── branch / condition ───────────────────────────────────────────────────

  private handleBranch(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): NodeResult {
    const field = stringValue(config.field);
    const operator = stringValue(config.operator, 'eq');
    const value = stringValue(config.value);

    const result = evaluateCondition(field, operator, value, ctx.variables);
    this.logger.log(
      `[FlowNode] Branch avaliado flow=${ctx.flowId} contact=${ctx.contactId} node=${ctx.nodeId} field=${field} operator=${operator} value=${value} result=${result ? 'yes' : 'no'}`,
    );
    return { kind: 'branch', label: result ? 'yes' : 'no' };
  }

  // ─── tag_contact ──────────────────────────────────────────────────────────

  private async handleTagContact(
    ctx: NodeContext,
    workspaceId: string,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const tagId = stringValue(config.tagId);
    const action = stringValue(config.action, 'add');

    if (!tagId) return { kind: 'next', nodeId: null };

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
    });
    if (!tag) {
      this.logger.warn(
        `[FlowNode] Tag não encontrada flow=${ctx.flowId} contact=${ctx.contactId} node=${ctx.nodeId} tag=${tagId}`,
      );
      return { kind: 'next', nodeId: null };
    }

    if (action === 'add') {
      await this.prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId: ctx.contactId, tagId } },
        create: { contactId: ctx.contactId, tagId },
        update: {},
      });
    } else {
      await this.prisma.contactTag.deleteMany({
        where: { contactId: ctx.contactId, tagId },
      });
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── move_stage ───────────────────────────────────────────────────────────

  private async handleMoveStage(
    ctx: NodeContext,
    workspaceId: string,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const stageId = stringValue(config.stageId);
    if (!stageId) return { kind: 'next', nodeId: null };

    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipeline: { workspaceId } },
      select: { id: true, pipelineId: true },
    });
    if (!stage) {
      this.logger.warn(
        `[FlowNode] Stage não encontrada flow=${ctx.flowId} contact=${ctx.contactId} node=${ctx.nodeId} stage=${stageId}`,
      );
      return { kind: 'next', nodeId: null };
    }

    await this.prisma.contactPipeline.upsert({
      where: {
        contactId_pipelineId: {
          contactId: ctx.contactId,
          pipelineId: stage.pipelineId,
        },
      },
      create: {
        contactId: ctx.contactId,
        pipelineId: stage.pipelineId,
        stageId,
      },
      update: { stageId },
    });

    return { kind: 'next', nodeId: null };
  }

  // ─── assign_to ────────────────────────────────────────────────────────────

  private async handleAssignTo(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const userId = this.optionalString(config.userId);
    const teamId = this.optionalString(config.teamId);

    this.logger.log(
      `[FlowNode] Alterando responsável flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId} user=${userId ?? 'none'} team=${teamId ?? 'none'}`,
    );

    await this.prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { assignedUserId: userId, teamId: teamId },
    });

    return { kind: 'next', nodeId: null };
  }

  // ─── send_template ────────────────────────────────────────────────────────

  private async handleSendTemplate(
    ctx: NodeContext,
    conversation: {
      id: string;
      whatsappAccountId: string;
      contact: { phone: string };
    },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const templateName = stringValue(config.templateName);
    const languageCode = stringValue(config.languageCode, 'pt_BR');
    const components = (config.components as unknown[]) ?? [];

    if (!templateName) return { kind: 'next', nodeId: null };

    try {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: conversation.whatsappAccountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

      const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.encryption.decrypt(account.token)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.contact.phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      });
      const externalId = await this.extractExternalMessageId(res);

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: 'interactive',
          content: templateName,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (err) {
      const error = this.formatError(err);
      this.logger.error(
        `[FlowNode] Falha ao enviar template flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId}: ${error.message}`,
        error.stack,
      );
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── webhook_call ─────────────────────────────────────────────────────────

  private async handleWebhookCall(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const url = stringValue(config.url);
    const method = stringValue(config.method, 'POST').toUpperCase();

    if (!url) return { kind: 'next', nodeId: null };

    const body = {
      contactId: ctx.contactId,
      conversationId: ctx.conversationId,
      flowId: ctx.flowId,
      variables: ctx.variables,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
      const saveResponseAs = this.optionalString(config.saveResponseAs);
      const responseBody = saveResponseAs
        ? await res.text().catch(() => '')
        : '';

      if (saveResponseAs && responseBody) {
        await this.prisma.contactFlowState.update({
          where: {
            contactId_flowId: { contactId: ctx.contactId, flowId: ctx.flowId },
          },
          data: {
            variables: {
              ...ctx.variables,
              [saveResponseAs]: responseBody,
            },
          },
        });
      }
    } catch (err) {
      const error = this.formatError(err);
      this.logger.error(
        `[FlowNode] webhook_call falhou flow=${ctx.flowId} conversation=${ctx.conversationId} contact=${ctx.contactId} node=${ctx.nodeId} url=${url}: ${error.message}`,
        error.stack,
      );
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── resolve edge target ──────────────────────────────────────────────────

  async resolveEdgeTarget(
    fromNodeId: string,
    label: string | null,
  ): Promise<string | null> {
    const edge = await this.prisma.flowEdge.findFirst({
      where: { fromNodeId, label: label ?? null },
      select: { toNodeId: true },
    });
    return edge?.toNodeId ?? null;
  }

  private formatError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack };
    }

    return { message: String(error) };
  }

  private optionalString(value: unknown): string | null {
    const normalized = stringValue(value);
    return normalized ? normalized : null;
  }

  private countInteractiveListRows(sections: unknown[]): number {
    return sections.reduce<number>((total, section) => {
      if (
        !section ||
        typeof section !== 'object' ||
        !Array.isArray((section as { rows?: unknown[] }).rows)
      ) {
        return total;
      }

      return total + (section as { rows: unknown[] }).rows.length;
    }, 0);
  }

  private async extractExternalMessageId(res: Response): Promise<string> {
    let payload: WhatsAppSendResponse | null = null;

    try {
      payload = (await res.json()) as WhatsAppSendResponse;
    } catch {
      throw new Error(`Resposta inválida da Meta (HTTP ${res.status})`);
    }

    const metaError =
      payload.error?.error_user_msg?.trim() ||
      payload.error?.message?.trim() ||
      '';

    if (!res.ok) {
      throw new Error(
        metaError ||
          `Falha ao enviar mensagem para a Meta (HTTP ${res.status})`,
      );
    }

    const externalId = payload.messages?.[0]?.id?.trim() ?? '';
    if (!externalId) {
      throw new Error(
        metaError || 'Meta não retornou o ID externo da mensagem enviada',
      );
    }

    return externalId;
  }
}
