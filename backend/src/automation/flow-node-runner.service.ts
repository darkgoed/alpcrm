import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../queues/scheduler.service';
import { interpolate, evaluateCondition } from './flow-variable.util';
import { isWithinBusinessHours } from '../common/utils/business-hours.util';

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
  ) {}

  async run(ctx: NodeContext): Promise<NodeResult> {
    const node = await this.prisma.flowNode.findUnique({ where: { id: ctx.nodeId } });
    if (!node) return { kind: 'done' };

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: ctx.conversationId },
      include: { contact: true, whatsappAccount: true },
    });
    if (!conversation || !conversation.isBotActive) return { kind: 'done' };

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
    conversation: { id: string; workspaceId: string; whatsappAccountId: string; contact: { phone: string } },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const wsSettings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId: conversation.workspaceId },
      select: { businessHours: true, timezone: true },
    });

    if (
      wsSettings?.businessHours &&
      !isWithinBusinessHours(
        wsSettings.businessHours as Record<string, { enabled: boolean; open: string; close: string }>,
        wsSettings.timezone ?? 'America/Sao_Paulo',
      )
    ) {
      this.logger.log(`[Bot] Fora do horário comercial — nó message ignorado (${ctx.conversationId})`);
      return { kind: 'next', nodeId: null };
    }

    const text = interpolate(String(config.content ?? ''), ctx.variables);

    try {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: conversation.whatsappAccountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

      const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${account.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.contact.phone,
          type: 'text',
          text: { body: text },
        }),
      });
      const data = (await res.json()) as { messages?: Array<{ id: string }> };
      const externalId = data.messages?.[0]?.id ?? '';

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: 'text',
          content: text,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`[Bot] Falha ao enviar mensagem: ${String(err)}`);
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── delay ────────────────────────────────────────────────────────────────

  private async handleDelay(
    ctx: NodeContext,
    node: { id: string; nextId: string | null },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const ms = Number(config.ms ?? 1000);

    // Resolve próximo nó para agendar via fila (suporta edges e nextId)
    const nextNodeId = await this.resolveEdgeTarget(node.id, null) ?? node.nextId;
    if (nextNodeId) {
      await this.scheduler.scheduleFlowDelay(ms, nextNodeId, ctx.conversationId, ctx.contactId, ctx.flowId);
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
      where: { contactId_flowId: { contactId: ctx.contactId, flowId: ctx.flowId } },
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
    conversation: { id: string; whatsappAccountId: string; contact: { phone: string } },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const interactiveType = String(config.interactiveType ?? 'button'); // 'button' | 'list'
    const body = interpolate(String(config.body ?? ''), ctx.variables);
    const footer = config.footer ? interpolate(String(config.footer), ctx.variables) : undefined;

    let action: Record<string, unknown>;

    if (interactiveType === 'list') {
      action = {
        button: interpolate(String(config.buttonText ?? 'Ver opções'), ctx.variables),
        sections: config.sections ?? [],
      };
    } else {
      const buttons = ((config.buttons as Array<{ id: string; title: string }>) ?? []).slice(0, 3);
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

    try {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: conversation.whatsappAccountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

      const url = `https://graph.facebook.com/v19.0/${account.metaAccountId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${account.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.contact.phone,
          type: 'interactive',
          interactive,
        }),
      });
      const data = (await res.json()) as { messages?: Array<{ id: string }> };
      const externalId = data.messages?.[0]?.id ?? '';

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: 'interactive',
          content: body,
          status: 'sent',
          externalId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`[Bot] Falha ao enviar interactive: ${String(err)}`);
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── branch / condition ───────────────────────────────────────────────────

  private handleBranch(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): NodeResult {
    const field = String(config.field ?? '');
    const operator = String(config.operator ?? 'eq');
    const value = String(config.value ?? '');

    const result = evaluateCondition(field, operator, value, ctx.variables);
    return { kind: 'branch', label: result ? 'yes' : 'no' };
  }

  // ─── tag_contact ──────────────────────────────────────────────────────────

  private async handleTagContact(
    ctx: NodeContext,
    workspaceId: string,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const tagId = String(config.tagId ?? '');
    const action = String(config.action ?? 'add'); // add | remove

    if (!tagId) return { kind: 'next', nodeId: null };

    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
    if (!tag) {
      this.logger.warn(`[Bot] Tag ${tagId} não encontrada no workspace`);
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
    const stageId = String(config.stageId ?? '');
    if (!stageId) return { kind: 'next', nodeId: null };

    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, pipeline: { workspaceId } },
      select: { id: true, pipelineId: true },
    });
    if (!stage) {
      this.logger.warn(`[Bot] Stage ${stageId} não encontrada`);
      return { kind: 'next', nodeId: null };
    }

    await this.prisma.contactPipeline.upsert({
      where: { contactId_pipelineId: { contactId: ctx.contactId, pipelineId: stage.pipelineId } },
      create: { contactId: ctx.contactId, pipelineId: stage.pipelineId, stageId },
      update: { stageId },
    });

    return { kind: 'next', nodeId: null };
  }

  // ─── assign_to ────────────────────────────────────────────────────────────

  private async handleAssignTo(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const userId = config.userId ? String(config.userId) : null;
    const teamId = config.teamId ? String(config.teamId) : null;

    await this.prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { assignedUserId: userId, teamId: teamId },
    });

    return { kind: 'next', nodeId: null };
  }

  // ─── send_template ────────────────────────────────────────────────────────

  private async handleSendTemplate(
    ctx: NodeContext,
    conversation: { id: string; whatsappAccountId: string; contact: { phone: string } },
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const templateName = String(config.templateName ?? '');
    const languageCode = String(config.languageCode ?? 'pt_BR');
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
        headers: { Authorization: `Bearer ${account.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.contact.phone,
          type: 'template',
          template: { name: templateName, language: { code: languageCode }, components },
        }),
      });
      const data = (await res.json()) as { messages?: Array<{ id: string }> };
      const externalId = data.messages?.[0]?.id ?? '';

      await this.prisma.message.create({
        data: {
          conversationId: ctx.conversationId,
          senderType: 'system',
          type: 'template',
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
      this.logger.error(`[Bot] Falha ao enviar template: ${String(err)}`);
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── webhook_call ─────────────────────────────────────────────────────────

  private async handleWebhookCall(
    ctx: NodeContext,
    config: Record<string, unknown>,
  ): Promise<NodeResult> {
    const url = String(config.url ?? '');
    const method = String(config.method ?? 'POST').toUpperCase();

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
      const responseBody = config.saveResponseAs
        ? await res.text().catch(() => '')
        : '';

      if (config.saveResponseAs && responseBody) {
        await this.prisma.contactFlowState.update({
          where: { contactId_flowId: { contactId: ctx.contactId, flowId: ctx.flowId } },
          data: {
            variables: { ...ctx.variables, [String(config.saveResponseAs)]: responseBody },
          },
        });
      }
    } catch (err) {
      this.logger.error(`[Bot] webhook_call falhou (${url}): ${String(err)}`);
    }

    return { kind: 'next', nodeId: null };
  }

  // ─── resolve edge target ──────────────────────────────────────────────────

  async resolveEdgeTarget(fromNodeId: string, label: string | null): Promise<string | null> {
    const edge = await this.prisma.flowEdge.findFirst({
      where: { fromNodeId, label: label ?? null },
      select: { toNodeId: true },
    });
    return edge?.toNodeId ?? null;
  }
}
