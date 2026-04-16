import { Test, TestingModule } from '@nestjs/testing';
import { AutoCloseProcessor, AutoCloseJobData } from './auto-close.processor';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { Job } from 'bullmq';

const WORKSPACE_ID = 'ws-1';
const CONVERSATION_ID = 'conv-1';
const SCHEDULED_AT = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

function buildJob(
  overrides: Partial<AutoCloseJobData> = {},
): Job<AutoCloseJobData> {
  return {
    data: {
      conversationId: CONVERSATION_ID,
      workspaceId: WORKSPACE_ID,
      scheduledAt: SCHEDULED_AT,
      ...overrides,
    },
  } as Job<AutoCloseJobData>;
}

function buildConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: CONVERSATION_ID,
    workspaceId: WORKSPACE_ID,
    status: 'open',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ...overrides,
  };
}

describe('AutoCloseProcessor', () => {
  let processor: AutoCloseProcessor;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<EventsGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoCloseProcessor,
        {
          provide: PrismaService,
          useValue: {
            conversation: { findUnique: jest.fn(), update: jest.fn() },
            message: { create: jest.fn() },
            workspaceSettings: { findUnique: jest.fn() },
          },
        },
        {
          provide: EventsGateway,
          useValue: { emitToWorkspace: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get(AutoCloseProcessor);
    prisma = module.get(PrismaService);
    gateway = module.get(EventsGateway);
  });

  // ─── Skip conditions ──────────────────────────────────────────────────────

  it('skips when conversation is not found', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    await processor.process(buildJob());

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('skips when conversation is already closed', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ status: 'closed' }),
    );

    await processor.process(buildJob());

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('skips when there was activity after the job was scheduled', async () => {
    // lastMessageAt is after scheduledAt → conversation is still active
    const recentActivity = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ lastMessageAt: recentActivity }),
    );

    await processor.process(buildJob());

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('skips when workspace has no autoCloseHours configured', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue({
      autoCloseHours: null,
    });

    await processor.process(buildJob());

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('skips when workspace settings are not found', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue(null);

    await processor.process(buildJob());

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  it('closes conversation and creates system message when all conditions are met', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue({
      autoCloseHours: 24,
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    const systemMsg = { id: 'sys-1', content: '🔒 Conversa encerrada automaticamente por inatividade.' };
    (prisma.message.create as jest.Mock).mockResolvedValue(systemMsg);

    await processor.process(buildJob());

    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONVERSATION_ID },
        data: expect.objectContaining({ status: 'closed', isBotActive: false }),
      }),
    );
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'system',
          type: 'text',
          status: 'sent',
        }),
      }),
    );
  });

  it('emits new_message socket event after closing', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue({
      autoCloseHours: 24,
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    const systemMsg = { id: 'sys-1' };
    (prisma.message.create as jest.Mock).mockResolvedValue(systemMsg);

    await processor.process(buildJob());

    expect(gateway.emitToWorkspace).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'new_message',
      expect.objectContaining({ conversationId: CONVERSATION_ID }),
    );
  });

  it('skips when lastMessageAt is null but scheduledAt is in the past', async () => {
    // lastMessageAt null means no activity — should still proceed to close
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ lastMessageAt: null }),
    );
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue({
      autoCloseHours: 24,
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.message.create as jest.Mock).mockResolvedValue({ id: 'sys-1' });

    await processor.process(buildJob());

    expect(prisma.conversation.update).toHaveBeenCalled();
  });
});
