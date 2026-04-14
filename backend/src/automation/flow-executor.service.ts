import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Flow, FlowTriggerType } from '@prisma/client';
import { FlowNodeRunnerService } from './flow-node-runner.service';
import { SchedulerService } from '../queues/scheduler.service';

type FlowTriggerContext = {
  incomingText?: string | null;
  replyId?: string | null;
  replyTitle?: string | null;
  isNewConversation?: boolean;
  eventType?: FlowTriggerType;
  eventValue?: string | null;
};

@Injectable()
export class FlowExecutorService {
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: FlowNodeRunnerService,
    private readonly scheduler: SchedulerService,
  ) {}

  // ─── Disparar flow em nova mensagem inbound ─────────────────────────────────

  async triggerForConversation(
    conversationId: string,
    workspaceId: string,
    contactId: string,
    incomingText: string | null,
    interactiveReply: {
      replyId?: string | null;
      title?: string | null;
    } | null,
    isNewConversation: boolean,
  ) {
    this.logger.log(
      `[Flow] Avaliando gatilhos conversation=${conversationId} contact=${contactId} workspace=${workspaceId} isNewConversation=${isNewConversation} incomingText="${incomingText ?? ''}"`,
    );

    const flows = await this.prisma.flow.findMany({
      where: { workspaceId, isActive: true },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });

    for (const flow of flows) {
      const matched = this.checkTrigger(flow.triggerType, flow.triggerValue, {
        incomingText,
        replyId: interactiveReply?.replyId ?? null,
        replyTitle: interactiveReply?.title ?? null,
        isNewConversation,
      });

      if (!matched) continue;

      this.logger.log(
        `[Flow] Gatilho correspondente flow=${flow.id} triggerType=${flow.triggerType} triggerValue="${flow.triggerValue ?? ''}" conversation=${conversationId} contact=${contactId}`,
      );
      await this.startFlow(flow, conversationId, contactId);
    }
  }

  // ─── Disparar flow por evento de sistema (tag, stage) ──────────────────────

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
        `[Bot] Nenhuma conversa para contacto ${contactId} no trigger ${eventType}`,
      );
      return;
    }

    const flows = await this.prisma.flow.findMany({
      where: { workspaceId, isActive: true, triggerType: eventType },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });

    for (const flow of flows) {
      const matched = this.checkTrigger(flow.triggerType, flow.triggerValue, {
        eventType,
        eventValue,
      });

      if (!matched) continue;

      this.logger.log(
        `[Flow] Gatilho de evento correspondente flow=${flow.id} triggerType=${flow.triggerType} eventValue="${eventValue}" contact=${contactId}`,
      );
      await this.startFlow(flow, conversation.id, contactId);
    }
  }

  // ─── Retomar flow após wait_for_reply ────────────────────────────────────────

  async resumeWaitingFlows(
    conversationId: string,
    contactId: string,
    incomingText: string,
    interactiveReply?: {
      replyId?: string | null;
      title?: string | null;
    } | null,
  ) {
    const states = await this.prisma.contactFlowState.findMany({
      where: { contactId, isActive: true, waitingForReply: true },
    });

    for (const state of states) {
      if (!state.currentNodeId) continue;

      this.logger.log(
        `[Flow] Retomando espera flow=${state.flowId} conversation=${conversationId} contact=${contactId} currentNode=${state.currentNodeId} incomingText="${incomingText}" replyId="${interactiveReply?.replyId ?? ''}" replyTitle="${interactiveReply?.title ?? ''}"`,
      );

      // Cancela timeout agendado para este nó
      await this.scheduler.cancelReplyTimeout(
        contactId,
        state.flowId,
        state.currentNodeId,
      );

      // Salva a resposta como variável
      const varName = await this.getReplyVariableName(state.currentNodeId);
      const variables = {
        ...(state.variables as Record<string, string>),
        [varName]: incomingText,
        reply: incomingText,
        ...(interactiveReply?.replyId
          ? { replyId: interactiveReply.replyId }
          : {}),
        ...(interactiveReply?.title
          ? { replyTitle: interactiveReply.title }
          : {}),
      };

      const candidateLabels = [
        interactiveReply?.replyId ?? null,
        interactiveReply?.title ?? null,
        incomingText || null,
        null,
      ].filter(
        (label, index, values): label is string | null =>
          values.indexOf(label) === index,
      );

      let nextNodeId: string | null = null;
      for (const label of candidateLabels) {
        nextNodeId = await this.runner.resolveEdgeTarget(
          state.currentNodeId,
          label,
        );
        if (nextNodeId) break;
      }

      nextNodeId =
        nextNodeId ??
        (
          await this.prisma.flowNode.findUnique({
            where: { id: state.currentNodeId },
          })
        )?.nextId ??
        null;

      await this.prisma.contactFlowState.update({
        where: { contactId_flowId: { contactId, flowId: state.flowId } },
        data: {
          waitingForReply: false,
          replyTimeoutAt: null,
          variables,
          currentNodeId: nextNodeId,
        },
      });

      if (nextNodeId) {
        this.logger.log(
          `[Flow] Resposta recebida, avançando flow=${state.flowId} contact=${contactId} nextNode=${nextNodeId}`,
        );
        await this.executeFromNode(
          nextNodeId,
          conversationId,
          contactId,
          state.flowId,
          variables,
        );
      } else {
        this.logger.log(
          `[Flow] Resposta recebida sem próximo nó flow=${state.flowId} contact=${contactId} - finalizando`,
        );
        await this.completeFlow(contactId, state.flowId, conversationId);
      }
    }
  }

  // ─── Executar nó por ID (chamado pelo FlowDelayProcessor) ──────────────────

  async executeNodeById(
    nodeId: string,
    conversationId: string,
    contactId: string,
    flowId: string,
  ) {
    this.logger.log(
      `[Flow] Executando nó por id flow=${flowId} conversation=${conversationId} contact=${contactId} node=${nodeId}`,
    );

    const state = await this.prisma.contactFlowState.findUnique({
      where: { contactId_flowId: { contactId, flowId } },
    });
    if (!state?.isActive) {
      this.logger.log(
        `[Flow] Ignorando execução atrasada flow=${flowId} conversation=${conversationId} contact=${contactId} node=${nodeId} - estado inativo`,
      );
      return;
    }

    const variables = (state?.variables as Record<string, string>) ?? {};

    await this.executeFromNode(
      nodeId,
      conversationId,
      contactId,
      flowId,
      variables,
    );
  }

  // ─── Lidar com timeout de wait_for_reply ────────────────────────────────────

  async handleReplyTimeout(
    contactId: string,
    flowId: string,
    conversationId: string,
    nodeId: string,
  ) {
    const state = await this.prisma.contactFlowState.findUnique({
      where: { contactId_flowId: { contactId, flowId } },
    });

    // Se o flow não está mais esperando (usuário respondeu), ignora
    if (!state?.isActive || !state.waitingForReply) return;

    const variables = (state.variables as Record<string, string>) ?? {};

    // Avança via edge "timeout" se existir, senão finaliza o flow
    const nextNodeId = await this.runner.resolveEdgeTarget(nodeId, 'timeout');

    await this.prisma.contactFlowState.update({
      where: { contactId_flowId: { contactId, flowId } },
      data: {
        waitingForReply: false,
        replyTimeoutAt: null,
        currentNodeId: nextNodeId,
      },
    });

    await this.prisma.flowExecutionLog.create({
      data: { flowId, contactId, nodeId, event: 'reply_timeout', detail: {} },
    });

    if (nextNodeId) {
      this.logger.log(
        `[Flow] Timeout avançando fluxo flow=${flowId} contact=${contactId} nextNode=${nextNodeId}`,
      );
      await this.executeFromNode(
        nextNodeId,
        conversationId,
        contactId,
        flowId,
        variables,
      );
    } else {
      this.logger.log(
        `[Flow] Timeout sem próximo nó flow=${flowId} contact=${contactId} - finalizando`,
      );
      await this.completeFlow(contactId, flowId, conversationId);
    }
  }

  // ─── Parar bot (operador assumiu) ──────────────────────────────────────────

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
      data: { isActive: false, waitingForReply: false },
    });

    this.logger.log(
      `[Bot] Parado para conversa ${conversationId} — operador assumiu`,
    );
  }

  // ─── Execução encadeada de nós ──────────────────────────────────────────────

  private async executeFromNode(
    nodeId: string,
    conversationId: string,
    contactId: string,
    flowId: string,
    variables: Record<string, string>,
  ) {
    let currentNodeId: string | null = nodeId;

    // Limita iterações para evitar loops infinitos
    for (let step = 0; step < 50 && currentNodeId; step++) {
      const currentNode = await this.prisma.flowNode.findUnique({
        where: { id: currentNodeId },
        select: { id: true, type: true },
      });

      this.logger.log(
        `[Flow] Etapa ${step + 1} flow=${flowId} conversation=${conversationId} contact=${contactId} node=${currentNodeId} type=${currentNode?.type ?? 'unknown'}`,
      );

      try {
        const result = await this.runner.run({
          nodeId: currentNodeId,
          conversationId,
          contactId,
          flowId,
          variables,
        });

        if (result.kind === 'done') {
          this.logger.log(
            `[Flow] Execução encerrada flow=${flowId} contact=${contactId} node=${currentNodeId} result=done`,
          );
          break;
        }

        if (result.kind === 'waiting') {
          this.logger.log(
            `[Flow] Flow aguardando resposta flow=${flowId} contact=${contactId} node=${currentNodeId}`,
          );
          break;
        }

        let nextId: string | null = null;

        if (result.kind === 'branch') {
          nextId = await this.runner.resolveEdgeTarget(
            currentNodeId,
            result.label,
          );
          this.logger.log(
            `[Flow] Decisão de branch flow=${flowId} contact=${contactId} node=${currentNodeId} label=${result.label} nextNode=${nextId ?? 'none'}`,
          );
          // fallback: sem edge "yes"/"no" → done
        } else if (result.kind === 'next') {
          if (result.nodeId) {
            nextId = result.nodeId;
          } else {
            nextId =
              (await this.runner.resolveEdgeTarget(currentNodeId, null)) ??
              (
                await this.prisma.flowNode.findUnique({
                  where: { id: currentNodeId },
                })
              )?.nextId ??
              null;
          }

          this.logger.log(
            `[Flow] Próxima etapa flow=${flowId} contact=${contactId} node=${currentNodeId} nextNode=${nextId ?? 'none'}`,
          );
        }

        if (!nextId) break;

        await this.prisma.contactFlowState.update({
          where: { contactId_flowId: { contactId, flowId } },
          data: { currentNodeId: nextId },
        });

        currentNodeId = nextId;
      } catch (error) {
        await this.logFlowError(
          flowId,
          contactId,
          currentNodeId,
          'Falha ao executar etapa do flow',
          error,
          { conversationId, step: step + 1, variables },
        );
        throw error;
      }
    }

    // Se chegou ao fim sem waiting ou delay, completa o flow
    const state = await this.prisma.contactFlowState.findUnique({
      where: { contactId_flowId: { contactId, flowId } },
    });
    if (state?.isActive && !state.waitingForReply) {
      await this.completeFlow(contactId, flowId, conversationId);
    }
  }

  // ─── Iniciar flow ──────────────────────────────────────────────────────────

  private async startFlow(
    flow: Flow & { nodes: Array<{ id: string }> },
    conversationId: string,
    contactId: string,
  ) {
    if (flow.nodes.length === 0) return;

    const existingState = await this.prisma.contactFlowState.findUnique({
      where: { contactId_flowId: { contactId, flowId: flow.id } },
    });
    if (existingState?.isActive) return;

    const firstNode = flow.nodes[0];

    this.logger.log(
      `[Flow] Iniciando flow=${flow.id} conversation=${conversationId} contact=${contactId} firstNode=${firstNode.id}`,
    );

    await this.prisma.contactFlowState.upsert({
      where: { contactId_flowId: { contactId, flowId: flow.id } },
      create: {
        contactId,
        flowId: flow.id,
        currentNodeId: firstNode.id,
        isActive: true,
      },
      update: {
        currentNodeId: firstNode.id,
        isActive: true,
        variables: {},
        waitingForReply: false,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive: true },
    });

    await this.prisma.flowExecutionLog.create({
      data: {
        flowId: flow.id,
        contactId,
        event: 'started',
        detail: { conversationId },
      },
    });

    await this.executeFromNode(
      firstNode.id,
      conversationId,
      contactId,
      flow.id,
      {},
    );
  }

  // ─── Completar flow ─────────────────────────────────────────────────────────

  private async completeFlow(
    contactId: string,
    flowId: string,
    conversationId: string,
  ) {
    await this.prisma.contactFlowState.update({
      where: { contactId_flowId: { contactId, flowId } },
      data: { isActive: false, currentNodeId: null, waitingForReply: false },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive: false },
    });

    await this.prisma.flowExecutionLog.create({
      data: { flowId, contactId, event: 'completed', detail: {} },
    });

    this.logger.log(
      `[Flow] Concluído flow=${flowId} conversation=${conversationId} contact=${contactId}`,
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private checkTrigger(
    triggerType: FlowTriggerType,
    triggerValue: string | null,
    ctx: FlowTriggerContext,
  ): boolean {
    switch (triggerType) {
      case 'new_conversation':
        return Boolean(ctx.isNewConversation);
      case 'always':
        return true;
      case 'keyword':
        return Boolean(
          triggerValue &&
          ctx.incomingText?.toLowerCase().includes(triggerValue.toLowerCase()),
        );
      case 'button_reply':
        return Boolean(
          triggerValue &&
          [ctx.replyId, ctx.replyTitle, ctx.incomingText]
            .filter((value): value is string => Boolean(value))
            .some(
              (value) => value.toLowerCase() === triggerValue.toLowerCase(),
            ),
        );
      case 'tag_applied':
      case 'stage_changed':
        return ctx.eventType === triggerType && triggerValue === ctx.eventValue;
      default:
        return false;
    }
  }

  private async findConversationForAutomation(
    workspaceId: string,
    contactId: string,
  ) {
    return (
      (await this.prisma.conversation.findFirst({
        where: { workspaceId, contactId, status: 'open' },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      })) ??
      (await this.prisma.conversation.findFirst({
        where: { workspaceId, contactId },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      }))
    );
  }

  private async getReplyVariableName(nodeId: string): Promise<string> {
    const node = await this.prisma.flowNode.findUnique({
      where: { id: nodeId },
    });
    const config = (node?.config as Record<string, unknown>) ?? {};
    return config.variableName ? String(config.variableName) : 'reply';
  }

  private async logFlowError(
    flowId: string,
    contactId: string,
    nodeId: string | null,
    message: string,
    error: unknown,
    extraDetail: Record<string, unknown> = {},
  ) {
    const err = this.formatError(error);

    this.logger.error(
      `[Flow] ${message} flow=${flowId} contact=${contactId} node=${nodeId ?? 'none'}: ${err.message}`,
      err.stack,
    );

    await this.prisma.flowExecutionLog.create({
      data: {
        flowId,
        contactId,
        nodeId,
        event: 'error',
        detail: {
          message: err.message,
          stack: err.stack ?? null,
          ...extraDetail,
        },
      },
    });
  }

  private formatError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack };
    }

    return { message: String(error) };
  }
}
