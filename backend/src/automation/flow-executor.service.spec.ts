import { Test, TestingModule } from '@nestjs/testing';
import { FlowExecutorService } from './flow-executor.service';
import { PrismaService } from '../prisma/prisma.service';
import { FlowNodeRunnerService } from './flow-node-runner.service';
import { SchedulerService } from '../queues/scheduler.service';
import { FlowTriggerType } from '@prisma/client';

const WORKSPACE_ID = 'ws-1';
const CONTACT_ID = 'contact-1';
const CONVERSATION_ID = 'conv-1';
const FLOW_ID = 'flow-1';
const NODE_ID = 'node-1';

function buildFlow(
  triggerType: FlowTriggerType,
  triggerValue: string | null = null,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FLOW_ID,
    workspaceId: WORKSPACE_ID,
    isActive: true,
    triggerType,
    triggerValue,
    nodes: [{ id: NODE_ID, order: 0 }],
    edges: [],
    ...overrides,
  };
}

function buildState(overrides: Record<string, unknown> = {}) {
  return {
    contactId: CONTACT_ID,
    flowId: FLOW_ID,
    currentNodeId: NODE_ID,
    isActive: true,
    waitingForReply: false,
    variables: {},
    ...overrides,
  };
}

describe('FlowExecutorService', () => {
  let service: FlowExecutorService;
  let prisma: jest.Mocked<PrismaService>;
  let runner: jest.Mocked<FlowNodeRunnerService>;
  let scheduler: jest.Mocked<SchedulerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowExecutorService,
        {
          provide: PrismaService,
          useValue: {
            flow: { findMany: jest.fn() },
            contactFlowState: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              upsert: jest.fn(),
            },
            conversation: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            flowNode: { findUnique: jest.fn() },
            flowExecutionLog: { create: jest.fn() },
          },
        },
        {
          provide: FlowNodeRunnerService,
          useValue: {
            run: jest.fn(),
            resolveEdgeTarget: jest.fn(),
          },
        },
        {
          provide: SchedulerService,
          useValue: {
            cancelReplyTimeout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(FlowExecutorService);
    prisma = module.get(PrismaService);
    runner = module.get(FlowNodeRunnerService);
    scheduler = module.get(SchedulerService);
  });

  // ─── Helper: set up mocks for a complete flow execution (done) ─────────────

  function mockFlowExecution() {
    (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(null); // no existing state in startFlow
    (prisma.contactFlowState.upsert as jest.Mock).mockResolvedValue({});
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.flowExecutionLog.create as jest.Mock).mockResolvedValue({});
    (prisma.flowNode.findUnique as jest.Mock).mockResolvedValue({
      id: NODE_ID,
      type: 'send_message',
    });
    (runner.run as jest.Mock).mockResolvedValue({ kind: 'done' });
    // After executeFromNode loop, check if flow should be completed
    (prisma.contactFlowState.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // startFlow: no existing active state
      .mockResolvedValue(buildState()); // after loop: state is active, not waiting
    (prisma.contactFlowState.update as jest.Mock).mockResolvedValue({});
  }

  // ─── triggerForConversation — trigger matching ────────────────────────────

  describe('triggerForConversation() — trigger types', () => {
    it('starts flow when trigger is always', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('always'),
      ]);
      mockFlowExecution();

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        'hello',
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).toHaveBeenCalled();
    });

    it('starts flow when trigger is new_conversation and conversation is new', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('new_conversation'),
      ]);
      mockFlowExecution();

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        null,
        true, // isNewConversation
      );

      expect(prisma.contactFlowState.upsert).toHaveBeenCalled();
    });

    it('does not start flow when trigger is new_conversation but conversation is not new', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('new_conversation'),
      ]);

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        null,
        false, // not a new conversation
      );

      expect(prisma.contactFlowState.upsert).not.toHaveBeenCalled();
    });

    it('starts flow when keyword matches incoming text (case-insensitive)', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('keyword', 'oi'),
      ]);
      mockFlowExecution();

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        'OI tudo bem',
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).toHaveBeenCalled();
    });

    it('does not start flow when keyword does not match', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('keyword', 'comprar'),
      ]);

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        'olá, tudo bem?',
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).not.toHaveBeenCalled();
    });

    it('starts flow on button_reply matching replyId', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('button_reply', 'sim'),
      ]);
      mockFlowExecution();

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        { replyId: 'sim', title: 'Sim' },
        false,
      );

      expect(prisma.contactFlowState.upsert).toHaveBeenCalled();
    });

    it('starts flow on button_reply matching replyTitle (case-insensitive)', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('button_reply', 'SIM'),
      ]);
      mockFlowExecution();

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        { replyId: 'btn-1', title: 'sim' },
        false,
      );

      expect(prisma.contactFlowState.upsert).toHaveBeenCalled();
    });

    it('does not start flow when no flows exist for workspace', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([]);

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        'hello',
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).not.toHaveBeenCalled();
    });
  });

  describe('triggerForConversation() — active state guard', () => {
    it('does not restart flow when state is already active', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('always'),
      ]);
      // startFlow: existing state is active → skip
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState({ isActive: true }),
      );

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).not.toHaveBeenCalled();
    });

    it('does not start flow with no nodes', async () => {
      (prisma.flow.findMany as jest.Mock).mockResolvedValue([
        buildFlow('always', null, { nodes: [], edges: [] }),
      ]);

      await service.triggerForConversation(
        CONVERSATION_ID,
        WORKSPACE_ID,
        CONTACT_ID,
        null,
        null,
        false,
      );

      expect(prisma.contactFlowState.upsert).not.toHaveBeenCalled();
    });
  });

  // ─── stopBotForConversation ───────────────────────────────────────────────

  describe('stopBotForConversation()', () => {
    it('does nothing when bot is not active', async () => {
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: CONVERSATION_ID,
        isBotActive: false,
      });

      await service.stopBotForConversation(CONVERSATION_ID, CONTACT_ID);

      expect(prisma.conversation.update).not.toHaveBeenCalled();
      expect(prisma.contactFlowState.updateMany).not.toHaveBeenCalled();
    });

    it('deactivates bot and all active flow states when bot is active', async () => {
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: CONVERSATION_ID,
        isBotActive: true,
      });
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});
      (prisma.contactFlowState.updateMany as jest.Mock).mockResolvedValue({});

      await service.stopBotForConversation(CONVERSATION_ID, CONTACT_ID);

      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isBotActive: false } }),
      );
      expect(prisma.contactFlowState.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contactId: CONTACT_ID, isActive: true },
          data: { isActive: false, waitingForReply: false },
        }),
      );
    });

    it('does nothing when conversation is not found', async () => {
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);

      await service.stopBotForConversation(CONVERSATION_ID, CONTACT_ID);

      expect(prisma.conversation.update).not.toHaveBeenCalled();
    });
  });

  // ─── executeNodeById ──────────────────────────────────────────────────────

  describe('executeNodeById()', () => {
    it('skips execution when flow state is not active', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState({ isActive: false }),
      );

      await service.executeNodeById(
        NODE_ID,
        CONVERSATION_ID,
        CONTACT_ID,
        FLOW_ID,
      );

      expect(runner.run).not.toHaveBeenCalled();
    });

    it('skips execution when flow state does not exist', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(null);

      await service.executeNodeById(
        NODE_ID,
        CONVERSATION_ID,
        CONTACT_ID,
        FLOW_ID,
      );

      expect(runner.run).not.toHaveBeenCalled();
    });

    it('executes from node when state is active', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock)
        .mockResolvedValueOnce(buildState()) // initial check
        .mockResolvedValue(buildState()); // post-execution check
      (prisma.flowNode.findUnique as jest.Mock).mockResolvedValue({
        id: NODE_ID,
        type: 'send_message',
      });
      (runner.run as jest.Mock).mockResolvedValue({ kind: 'done' });
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});
      (prisma.contactFlowState.update as jest.Mock).mockResolvedValue({});
      (prisma.flowExecutionLog.create as jest.Mock).mockResolvedValue({});

      await service.executeNodeById(
        NODE_ID,
        CONVERSATION_ID,
        CONTACT_ID,
        FLOW_ID,
      );

      expect(runner.run).toHaveBeenCalledWith(
        expect.objectContaining({ nodeId: NODE_ID, contactId: CONTACT_ID }),
      );
    });
  });

  // ─── handleReplyTimeout ───────────────────────────────────────────────────

  describe('handleReplyTimeout()', () => {
    it('does nothing when state is not found', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(null);

      await service.handleReplyTimeout(
        CONTACT_ID,
        FLOW_ID,
        CONVERSATION_ID,
        NODE_ID,
      );

      expect(prisma.contactFlowState.update).not.toHaveBeenCalled();
    });

    it('does nothing when state is not waiting for reply', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState({ waitingForReply: false }),
      );

      await service.handleReplyTimeout(
        CONTACT_ID,
        FLOW_ID,
        CONVERSATION_ID,
        NODE_ID,
      );

      expect(prisma.contactFlowState.update).not.toHaveBeenCalled();
    });

    it('does nothing when state is inactive', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState({ isActive: false, waitingForReply: true }),
      );

      await service.handleReplyTimeout(
        CONTACT_ID,
        FLOW_ID,
        CONVERSATION_ID,
        NODE_ID,
      );

      expect(prisma.contactFlowState.update).not.toHaveBeenCalled();
    });

    it('advances via timeout edge when one exists', async () => {
      const NEXT_NODE = 'node-timeout';
      (prisma.contactFlowState.findUnique as jest.Mock)
        .mockResolvedValueOnce(buildState({ waitingForReply: true }))
        .mockResolvedValue(buildState());
      (runner.resolveEdgeTarget as jest.Mock).mockResolvedValue(NEXT_NODE);
      (prisma.contactFlowState.update as jest.Mock).mockResolvedValue({});
      (prisma.flowExecutionLog.create as jest.Mock).mockResolvedValue({});
      (prisma.flowNode.findUnique as jest.Mock).mockResolvedValue({
        id: NEXT_NODE,
        type: 'send_message',
      });
      (runner.run as jest.Mock).mockResolvedValue({ kind: 'done' });
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});

      await service.handleReplyTimeout(
        CONTACT_ID,
        FLOW_ID,
        CONVERSATION_ID,
        NODE_ID,
      );

      expect(runner.resolveEdgeTarget).toHaveBeenCalledWith(NODE_ID, 'timeout');
      expect(prisma.contactFlowState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ waitingForReply: false }),
        }),
      );
    });

    it('completes flow when no timeout edge exists', async () => {
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState({ waitingForReply: true }),
      );
      (runner.resolveEdgeTarget as jest.Mock).mockResolvedValue(null); // no timeout edge
      (prisma.contactFlowState.update as jest.Mock).mockResolvedValue({});
      (prisma.flowExecutionLog.create as jest.Mock).mockResolvedValue({});
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});

      await service.handleReplyTimeout(
        CONTACT_ID,
        FLOW_ID,
        CONVERSATION_ID,
        NODE_ID,
      );

      // Should call completeFlow: contactFlowState.update with isActive=false
      expect(prisma.contactFlowState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  // ─── resumeWaitingFlows ───────────────────────────────────────────────────

  describe('resumeWaitingFlows()', () => {
    it('does nothing when no flows are waiting for reply', async () => {
      (prisma.contactFlowState.findMany as jest.Mock).mockResolvedValue([]);

      await service.resumeWaitingFlows(
        CONVERSATION_ID,
        CONTACT_ID,
        'hello',
        null,
      );

      expect(runner.resolveEdgeTarget).not.toHaveBeenCalled();
    });

    it('skips state when currentNodeId is null', async () => {
      (prisma.contactFlowState.findMany as jest.Mock).mockResolvedValue([
        buildState({ waitingForReply: true, currentNodeId: null }),
      ]);

      await service.resumeWaitingFlows(
        CONVERSATION_ID,
        CONTACT_ID,
        'hello',
        null,
      );

      expect(scheduler.cancelReplyTimeout).not.toHaveBeenCalled();
    });

    it('cancels reply timeout and advances flow on incoming text', async () => {
      const NEXT_NODE = 'node-2';
      (prisma.contactFlowState.findMany as jest.Mock).mockResolvedValue([
        buildState({ waitingForReply: true, currentNodeId: NODE_ID }),
      ]);
      (scheduler.cancelReplyTimeout as jest.Mock).mockResolvedValue(undefined);
      (prisma.flowNode.findUnique as jest.Mock).mockResolvedValue({
        id: NODE_ID,
        config: { variableName: 'userReply' },
      });
      (runner.resolveEdgeTarget as jest.Mock).mockResolvedValue(NEXT_NODE);
      (prisma.contactFlowState.update as jest.Mock).mockResolvedValue({});
      // After update, executeFromNode
      (prisma.flowNode.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: NODE_ID,
          config: { variableName: 'userReply' },
        })
        .mockResolvedValue({ id: NEXT_NODE, type: 'send_message' });
      (runner.run as jest.Mock).mockResolvedValue({ kind: 'done' });
      (prisma.contactFlowState.findUnique as jest.Mock).mockResolvedValue(
        buildState(),
      );
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});
      (prisma.flowExecutionLog.create as jest.Mock).mockResolvedValue({});

      await service.resumeWaitingFlows(
        CONVERSATION_ID,
        CONTACT_ID,
        'sim',
        null,
      );

      expect(scheduler.cancelReplyTimeout).toHaveBeenCalledWith(
        CONTACT_ID,
        FLOW_ID,
        NODE_ID,
      );
      expect(prisma.contactFlowState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ waitingForReply: false }),
        }),
      );
    });
  });
});
