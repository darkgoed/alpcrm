import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SchedulerService } from '../queues/scheduler.service';
import { WhatsappMetaClient } from './whatsapp-meta-client.service';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsappWebhookPayload } from './dto/webhook.dto';

const PHONE_NUMBER_ID = 'phone-id-1';
const WORKSPACE_ID = 'ws-1';
const ACCOUNT = {
  id: 'acct-1',
  workspaceId: WORKSPACE_ID,
  token: 'token-1',
  metaAccountId: PHONE_NUMBER_ID,
  isActive: true,
};
const CONTACT = { id: 'contact-1', phone: '5511999999999', name: 'Test User' };
const CONVERSATION = {
  id: 'conv-1',
  workspaceId: WORKSPACE_ID,
  unreadCount: 0,
  isBotActive: false,
};
const HYDRATED_MESSAGE = {
  id: 'msg-1',
  type: 'text',
  content: 'Hello',
  status: 'delivered',
  replyToMessage: null,
};

function buildTextPayload(
  msgId = 'ext-1',
  phoneNumberId = PHONE_NUMBER_ID,
): WhatsappWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+551234567890',
                phone_number_id: phoneNumberId,
              },
              contacts: [
                { profile: { name: 'Test User' }, wa_id: '5511999999999' },
              ],
              messages: [
                {
                  id: msgId,
                  from: '5511999999999',
                  timestamp: '1234567890',
                  type: 'text',
                  text: { body: 'Hello' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function buildStatusPayload(
  msgId = 'ext-1',
  statusValue: 'sent' | 'delivered' | 'read' | 'failed' = 'delivered',
): WhatsappWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+551234567890',
                phone_number_id: PHONE_NUMBER_ID,
              },
              statuses: [
                {
                  id: msgId,
                  status: statusValue,
                  timestamp: '1234567890',
                  recipient_id: '5511999999999',
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('WhatsappService', () => {
  let service: WhatsappService;
  let prisma: jest.Mocked<PrismaService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: PrismaService,
          useValue: {
            webhookReceipt: { create: jest.fn() },
            whatsappAccount: { findFirst: jest.fn() },
            contact: { upsert: jest.fn() },
            conversation: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
            message: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
            team: { findFirst: jest.fn() },
            workspaceSettings: { findUnique: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        {
          provide: TeamsService,
          useValue: { getNextMember: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: FlowExecutorService,
          useValue: {
            resumeWaitingFlows: jest.fn().mockResolvedValue(undefined),
            triggerForConversation: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SchedulerService,
          useValue: {
            cancelFollowUps: jest.fn().mockResolvedValue(undefined),
            scheduleFollowUps: jest.fn().mockResolvedValue(undefined),
            scheduleAutoClose: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: WhatsappMetaClient,
          useValue: { downloadMedia: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: MetricsService,
          useValue: {
            messagesReceivedTotal: { inc: jest.fn() },
            messagesSentTotal: { inc: jest.fn() },
            webhookErrorsTotal: { inc: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(WhatsappService);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
  });

  // ─── verifyWebhook ────────────────────────────────────────────────────────────

  describe('verifyWebhook()', () => {
    it('returns challenge when mode is subscribe and token matches', () => {
      (config.get as jest.Mock).mockReturnValue('my_token');
      expect(service.verifyWebhook('subscribe', 'my_token', 'challenge_abc')).toBe(
        'challenge_abc',
      );
    });

    it('uses default verify token when env var is not set', () => {
      (config.get as jest.Mock).mockReturnValue('crm_verify_token');
      expect(
        service.verifyWebhook('subscribe', 'crm_verify_token', 'ch'),
      ).toBe('ch');
    });

    it('throws NotFoundException when token does not match', () => {
      (config.get as jest.Mock).mockReturnValue('correct_token');
      expect(() =>
        service.verifyWebhook('subscribe', 'wrong_token', 'ch'),
      ).toThrow(NotFoundException);
    });

    it('throws NotFoundException when mode is not subscribe', () => {
      (config.get as jest.Mock).mockReturnValue('token');
      expect(() =>
        service.verifyWebhook('unsubscribe', 'token', 'ch'),
      ).toThrow(NotFoundException);
    });
  });

  // ─── processWebhook — early returns ──────────────────────────────────────────

  describe('processWebhook() — early returns', () => {
    it('ignores payload when object is not whatsapp_business_account', async () => {
      const onMessage = jest.fn();
      await service.processWebhook(
        { object: 'page', entry: [] } as unknown as WhatsappWebhookPayload,
        onMessage,
      );
      expect(prisma.webhookReceipt.create).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('skips change when field is not messages', async () => {
      const onMessage = jest.fn();
      const payload: WhatsappWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'e1',
            changes: [
              {
                field: 'account_alerts',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+55',
                    phone_number_id: 'pid',
                  },
                },
              },
            ],
          },
        ],
      };
      await service.processWebhook(payload, onMessage);
      expect(prisma.webhookReceipt.create).not.toHaveBeenCalled();
    });
  });

  // ─── processWebhook — inbound message idempotency ─────────────────────────────

  describe('processWebhook() — message idempotency', () => {
    it('skips processing when webhook receipt is already claimed', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('unique'), { code: 'P2002' }),
      );

      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.whatsappAccount.findFirst).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  // ─── processWebhook — account lookup ─────────────────────────────────────────

  describe('processWebhook() — account lookup', () => {
    it('skips processing when no account matches phone_number_id', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockResolvedValue({});
      (prisma.whatsappAccount.findFirst as jest.Mock).mockResolvedValue(null);

      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.contact.upsert).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  // ─── processWebhook — message deduplication ──────────────────────────────────

  describe('processWebhook() — message deduplication', () => {
    it('skips message creation when externalId already exists', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockResolvedValue({});
      (prisma.whatsappAccount.findFirst as jest.Mock).mockResolvedValue(ACCOUNT);
      (prisma.contact.upsert as jest.Mock).mockResolvedValue(CONTACT);
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        CONVERSATION,
      );
      // Duplicate: message already exists
      (prisma.message.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-msg',
      });

      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.message.create).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  // ─── processWebhook — happy path ─────────────────────────────────────────────

  describe('processWebhook() — happy path', () => {
    beforeEach(() => {
      (prisma.webhookReceipt.create as jest.Mock).mockResolvedValue({});
      (prisma.whatsappAccount.findFirst as jest.Mock).mockResolvedValue(ACCOUNT);
      (prisma.contact.upsert as jest.Mock).mockResolvedValue(CONTACT);
      // No open conversation, no closed conversation
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.team.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.conversation.create as jest.Mock).mockResolvedValue(CONVERSATION);
      // No duplicate
      (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.message.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });
      (prisma.message.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        HYDRATED_MESSAGE,
      );
      (prisma.conversation.update as jest.Mock).mockResolvedValue(CONVERSATION);
      // No out-of-hours settings
      (prisma.workspaceSettings.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it('persists the message and emits new_message event', async () => {
      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload('ext-42'), onMessage);

      expect(prisma.message.create).toHaveBeenCalledTimes(1);
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'new_message',
          workspaceId: WORKSPACE_ID,
          conversationId: CONVERSATION.id,
        }),
      );
    });

    it('creates a new conversation when none exists', async () => {
      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ workspaceId: WORKSPACE_ID }),
        }),
      );
    });

    it('reuses existing open conversation without creating a new one', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        CONVERSATION,
      );

      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it('upserts contact with name from WhatsApp profile', async () => {
      const onMessage = jest.fn();
      await service.processWebhook(buildTextPayload(), onMessage);

      expect(prisma.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ name: 'Test User' }),
        }),
      );
    });
  });

  // ─── processWebhook — status update ──────────────────────────────────────────

  describe('processWebhook() — status update', () => {
    it('skips status update when receipt is already claimed (duplicate)', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('unique'), { code: 'P2002' }),
      );

      const onMessage = jest.fn();
      await service.processWebhook(buildStatusPayload(), onMessage);

      expect(prisma.message.findFirst).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('skips status update when message is not found', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockResolvedValue({});
      (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);

      const onMessage = jest.fn();
      await service.processWebhook(buildStatusPayload(), onMessage);

      expect(prisma.message.update).not.toHaveBeenCalled();
    });

    it('updates message status and emits message_status event', async () => {
      (prisma.webhookReceipt.create as jest.Mock).mockResolvedValue({});
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        conversation: { workspaceId: WORKSPACE_ID },
      };
      (prisma.message.findFirst as jest.Mock).mockResolvedValue(msg);
      (prisma.message.update as jest.Mock).mockResolvedValue({});

      const onMessage = jest.fn();
      await service.processWebhook(buildStatusPayload('ext-1', 'read'), onMessage);

      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'read' } }),
      );
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'message_status',
          status: 'read',
          workspaceId: WORKSPACE_ID,
        }),
      );
    });
  });
});
