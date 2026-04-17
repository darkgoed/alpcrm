import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpProcessor, FollowUpJobData } from './follow-up.processor';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';
import { Job } from 'bullmq';

const WORKSPACE_ID = 'ws-1';
const CONVERSATION_ID = 'conv-1';
const CONTACT_ID = 'contact-1';
const RULE_ID = 'rule-1';
const SCHEDULED_AT = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago

function buildJob(
  overrides: Partial<FollowUpJobData> = {},
): Job<FollowUpJobData> {
  return {
    data: {
      conversationId: CONVERSATION_ID,
      workspaceId: WORKSPACE_ID,
      contactId: CONTACT_ID,
      ruleId: RULE_ID,
      message: 'Podemos ajudar com algo mais?',
      scheduledAt: SCHEDULED_AT,
      ...overrides,
    },
  } as Job<FollowUpJobData>;
}

function buildConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: CONVERSATION_ID,
    workspaceId: WORKSPACE_ID,
    status: 'open',
    whatsappAccountId: 'acct-1',
    contact: { id: CONTACT_ID, phone: '+5511999999999' },
    ...overrides,
  };
}

describe('FollowUpProcessor', () => {
  let processor: FollowUpProcessor;
  let prisma: jest.Mocked<PrismaService>;
  let whatsapp: jest.Mocked<WhatsappService>;
  let gateway: jest.Mocked<EventsGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpProcessor,
        {
          provide: PrismaService,
          useValue: {
            conversation: { findUnique: jest.fn(), update: jest.fn() },
            message: { findFirst: jest.fn(), create: jest.fn() },
            followUpRule: { findUnique: jest.fn() },
            workspaceSettings: { findUnique: jest.fn() },
          },
        },
        {
          provide: WhatsappService,
          useValue: {
            sendTextMessage: jest.fn().mockResolvedValue('ext-msg-1'),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            emitToWorkspace: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get(FollowUpProcessor);
    prisma = module.get(PrismaService);
    whatsapp = module.get(WhatsappService);
    gateway = module.get(EventsGateway);
  });

  // ─── Skip conditions ──────────────────────────────────────────────────────

  it('skips when conversation is not found', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('skips when conversation is already closed', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ status: 'closed' }),
    );

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('skips when contact replied after job was scheduled', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    // Contact message exists after scheduledAt
    (prisma.message.findFirst as jest.Mock).mockResolvedValue({
      id: 'recent-msg',
    });

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('skips when follow-up rule is inactive', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue({
      id: RULE_ID,
      isActive: false,
    });

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('skips when follow-up rule is not found', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue(null);

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('skips when outside business hours', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation(),
    );
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue({
      id: RULE_ID,
      isActive: true,
    });
    // Business hours: closed all day
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue({
      timezone: 'America/Sao_Paulo',
      businessHours: {
        monday: { enabled: false, open: '09:00', close: '18:00' },
        tuesday: { enabled: false, open: '09:00', close: '18:00' },
        wednesday: { enabled: false, open: '09:00', close: '18:00' },
        thursday: { enabled: false, open: '09:00', close: '18:00' },
        friday: { enabled: false, open: '09:00', close: '18:00' },
        saturday: { enabled: false, open: '09:00', close: '18:00' },
        sunday: { enabled: false, open: '09:00', close: '18:00' },
      },
    });

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  it('sends follow-up message and emits socket event', async () => {
    const conv = buildConversation();
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(conv);
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue({
      id: RULE_ID,
      isActive: true,
    });
    // No business hours restriction
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue(null);

    const savedMsg = {
      id: 'msg-fu-1',
      content: 'Podemos ajudar com algo mais?',
    };
    (prisma.message.create as jest.Mock).mockResolvedValue(savedMsg);
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    await processor.process(buildJob());

    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(
      'acct-1',
      '+5511999999999',
      'Podemos ajudar com algo mais?',
    );
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'system',
          content: 'Podemos ajudar com algo mais?',
          status: 'sent',
        }),
      }),
    );
    expect(gateway.emitToWorkspace).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'new_message',
      expect.objectContaining({ conversationId: CONVERSATION_ID }),
    );
  });

  it('updates conversation lastMessageAt after sending', async () => {
    const conv = buildConversation();
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(conv);
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue({
      id: RULE_ID,
      isActive: true,
    });
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.message.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    await processor.process(buildJob());

    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONVERSATION_ID },
        data: expect.objectContaining({ lastMessageAt: expect.any(Date) }),
      }),
    );
  });

  it('rethrows error so BullMQ can retry', async () => {
    const conv = buildConversation();
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(conv);
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.followUpRule.findUnique as jest.Mock).mockResolvedValue({
      id: RULE_ID,
      isActive: true,
    });
    (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (whatsapp.sendTextMessage as jest.Mock).mockRejectedValue(
      new Error('Meta API error'),
    );

    await expect(processor.process(buildJob())).rejects.toThrow(
      'Meta API error',
    );
  });
});
