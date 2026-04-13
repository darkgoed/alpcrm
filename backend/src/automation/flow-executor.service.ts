import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Flow, FlowTriggerType } from '@prisma/client';
import { SchedulerService } from '../queues/scheduler.service';
import { isWithinBusinessHours } from '../common/utils/business-hours.util';

type FlowTriggerContext = {
  incomingText?: string | null;
  isNewConversation?: boolean;
  eventType?: FlowTriggerType;
  eventValue?: string | null;
};

@Injectable()
export class FlowExecutorService {
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(
    private prisma: PrismaService,
    private scheduler: SchedulerService,
  ) {}

  // ─── Disparar flow quando nova mensagem chega ────────────────────────────────

  async triggerForConversation(
    conversationId: string,
    workspaceId: string,
    contactId: string,
    incomingText: string | null,
    isNewConversation: boolean,
    sendFn: (accountId: string, to: string, text: string) => Promise<string>,
  ) {
    const flows = await this.prisma.flow.findMany({
      where: { workspaceId, isActive: true },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });

    for (const flow of flows) {
      const matches = this.checkTrigger(flow.triggerType, flow.triggerValue, {
        incomingText,
        isNewConversation,
      });
      if (!matches) continue;

      await this.startFlow(flow, conversationId, contactId, sendFn);
    }
  }

  async triggerForContactEvent(
    workspaceId: string,
    contactId: string,
    eventType: FlowTriggerType,
    eventValue: string,
  ) {
    const conversation = await this.findConversationForAutomation(
      workspaceId,
      contactId,
    );

    if (!conversation) {
      this.logger.warn(
        `[Bot] Nenhuma conversa utilizável para contato ${contactId} no trigger ${eventType}`,
      );
      return;
    }

    const sendFn = this.createSendFn();
    const flows = await this.prisma.flow.findMany({
      where: { workspaceId, isActive: true, triggerType: eventType },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });

    for (const flow of flows) {
      const matches = this.checkTrigger(flow.triggerType, flow.triggerValue, {
        eventType,
        eventValue,
      });
      if (!matches) continue;

      await this.startFlow(flow, conversation.id, contactId, sendFn);
    }
  }

  // ─── Executar nó por ID (chamado pelo FlowDelayProcessor) ────────────────────

  async executeNodeById(
    nodeId: string,
    conversationId: string,
    contactId: string,
    flowId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { whatsappAccount: true },
    });
    if (!conversation) return;

    const sendFn = this.createSendFn();

    await this.executeNode(nodeId, conversationId, contactId, flowId, sendFn);
  }

  // ─── Executar nó ─────────────────────────────────────────────────────────────

  async executeNode(
    nodeId: string,
    conversationId: string,
    contactId: string,
    flowId: string,
    sendFn: (accountId: string, to: string, text: string) => Promise<string>,
  ) {
    const node = await this.prisma.flowNode.findUnique({
      where: { id: nodeId },
    });
    if (!node) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation || !conversation.isBotActive) return;

    const config = node.config as Record<string, any>;

    if (node.type === 'message') {
      // Respeita horário comercial do workspace
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
          `[Bot] Fora do horário comercial — nó de mensagem ignorado (conversa ${conversationId})`,
        );
        if (node.nextId) {
          await this.prisma.contactFlowState.update({
            where: { contactId_flowId: { contactId, flowId } },
            data: { currentNodeId: node.nextId },
          });
          await this.executeNode(
            node.nextId,
            conversationId,
            contactId,
            flowId,
            sendFn,
          );
        } else {
          await this.completeFlow(contactId, flowId, conversationId);
        }
        return;
      }

      try {
        const externalId = await sendFn(
          conversation.whatsappAccountId,
          conversation.contact.phone,
          config.content ?? '',
        );

        await this.prisma.message.create({
          data: {
            conversationId,
            senderType: 'system',
            type: 'text',
            content: config.content ?? '',
            status: 'sent',
            externalId,
          },
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        this.logger.log(`[Bot] Mensagem enviada → conversa ${conversationId}`);
      } catch (err) {
        this.logger.error(`[Bot] Falha ao enviar mensagem: ${err}`);
      }

      if (node.nextId) {
        await this.prisma.contactFlowState.update({
          where: { contactId_flowId: { contactId, flowId } },
          data: { currentNodeId: node.nextId },
        });
        await this.executeNode(
          node.nextId,
          conversationId,
          contactId,
          flowId,
          sendFn,
        );
      } else {
        await this.completeFlow(contactId, flowId, conversationId);
      }
    } else if (node.type === 'delay') {
      const ms = config.ms ?? 1000;

      await this.prisma.contactFlowState.update({
        where: { contactId_flowId: { contactId, flowId } },
        data: { currentNodeId: node.nextId ?? null },
      });

      if (node.nextId) {
        // Usa BullMQ para delay confiável (sobrevive a restart)
        await this.scheduler.scheduleFlowDelay(
          ms,
          node.nextId,
          conversationId,
          contactId,
          flowId,
        );
      } else {
        setTimeout(
          () => this.completeFlow(contactId, flowId, conversationId),
          ms,
        );
      }
    } else {
      if (node.nextId) {
        await this.executeNode(
          node.nextId,
          conversationId,
          contactId,
          flowId,
          sendFn,
        );
      } else {
        await this.completeFlow(contactId, flowId, conversationId);
      }
    }
  }

  // ─── Parar bot (operador respondeu) ─────────────────────────────────────────

  async stopBotForConversation(conversationId: string, contactId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation?.isBotActive) return;

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive: false },
    });

    await this.prisma.contactFlowState.updateMany({
      where: { contactId, isActive: true },
      data: { isActive: false },
    });

    this.logger.log(
      `[Bot] Parado para conversa ${conversationId} — operador assumiu`,
    );
  }

  // ─── Completar flow ───────────────────────────────────────────────────────────

  private async completeFlow(
    contactId: string,
    flowId: string,
    conversationId: string,
  ) {
    await this.prisma.contactFlowState.update({
      where: { contactId_flowId: { contactId, flowId } },
      data: { isActive: false, currentNodeId: null },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive: false },
    });

    this.logger.log(`[Bot] Flow ${flowId} concluído para contato ${contactId}`);
  }

  // ─── Verificar trigger ────────────────────────────────────────────────────────

  private checkTrigger(
    triggerType: FlowTriggerType,
    triggerValue: string | null,
    context: FlowTriggerContext,
  ): boolean {
    if (triggerType === 'new_conversation')
      return Boolean(context.isNewConversation);
    if (triggerType === 'always') return true;
    if (triggerType === 'keyword' && triggerValue && context.incomingText) {
      return context.incomingText
        .toLowerCase()
        .includes(triggerValue.toLowerCase());
    }
    if (
      (triggerType === 'tag_applied' || triggerType === 'stage_changed') &&
      context.eventType === triggerType
    ) {
      return triggerValue === context.eventValue;
    }
    return false;
  }

  private async startFlow(
    flow: Flow & { nodes: Array<{ id: string }> },
    conversationId: string,
    contactId: string,
    sendFn: (accountId: string, to: string, text: string) => Promise<string>,
  ) {
    const existingState = await this.prisma.contactFlowState.findUnique({
      where: { contactId_flowId: { contactId, flowId: flow.id } },
    });

    if (existingState?.isActive) return;
    if (flow.nodes.length === 0) return;

    const firstNode = flow.nodes[0];

    await this.prisma.contactFlowState.upsert({
      where: { contactId_flowId: { contactId, flowId: flow.id } },
      create: {
        contactId,
        flowId: flow.id,
        currentNodeId: firstNode.id,
        isActive: true,
      },
      update: { currentNodeId: firstNode.id, isActive: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive: true },
    });

    await this.executeNode(
      firstNode.id,
      conversationId,
      contactId,
      flow.id,
      sendFn,
    );
  }

  private async findConversationForAutomation(
    workspaceId: string,
    contactId: string,
  ) {
    const openConversation = await this.prisma.conversation.findFirst({
      where: { workspaceId, contactId, status: 'open' },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });

    if (openConversation) return openConversation;

    return this.prisma.conversation.findFirst({
      where: { workspaceId, contactId },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
  }

  private createSendFn() {
    return async (accountId: string, to: string, text: string) => {
      const account = await this.prisma.whatsappAccount.findUnique({
        where: { id: accountId },
      });
      if (!account) throw new Error('Conta WhatsApp não encontrada');

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
      const data: any = await response.json();
      return data.messages?.[0]?.id ?? '';
    };
  }
}
