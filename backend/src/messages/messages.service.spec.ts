import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FlowExecutorService } from '../automation/flow-executor.service';
import { SchedulerService } from '../queues/scheduler.service';
import { SendMessageDto } from './dto/send-message.dto';
import { OUTBOUND_MESSAGE_QUEUE } from '../queues/queues.constants';

const WORKSPACE_ID = 'ws-1';
const USER_ID = 'user-1';
const CONVERSATION_ID = 'conv-1';

function buildDto(overrides: Partial<SendMessageDto> = {}): SendMessageDto {
  return Object.assign(new SendMessageDto(), {
    conversationId: CONVERSATION_ID,
    content: 'hi',
    type: 'text' as SendMessageDto['type'],
    ...overrides,
  });
}

function buildConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: CONVERSATION_ID,
    workspaceId: WORKSPACE_ID,
    status: 'open',
    isBotActive: false,
    assignedUserId: null,
    whatsappAccountId: 'acct-1',
    lastContactMessageAt: new Date(),
    contact: { id: 'contact-1', phone: '+5511999999999', optInStatus: 'opted_in' },
    whatsappAccount: { id: 'acct-1' },
    ...overrides,
  };
}

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<EventsGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: {
            conversation: { findFirst: jest.fn(), update: jest.fn() },
            message: { create: jest.fn(), findFirst: jest.fn(), findUniqueOrThrow: jest.fn() },
          },
        },
        { provide: WhatsappService, useValue: {} },
        {
          provide: EventsGateway,
          useValue: {
            emitToWorkspace: jest.fn(),
            getActiveOperatorIds: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: FlowExecutorService,
          useValue: {
            stopBotForConversation: jest.fn(),
            triggerForConversation: jest.fn(),
          },
        },
        {
          provide: SchedulerService,
          useValue: {
            cancelFollowUps: jest.fn().mockResolvedValue(undefined),
            scheduleFollowUp: jest.fn(),
          },
        },
        {
          provide: getQueueToken(OUTBOUND_MESSAGE_QUEUE),
          useValue: { add: jest.fn().mockResolvedValue({ id: 'job-1' }) },
        },
      ],
    }).compile();

    service = module.get(MessagesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(EventsGateway) as jest.Mocked<EventsGateway>;
  });

  describe('send() — permission guard', () => {
    it('throws ForbiddenException when user lacks respond_conversation permission', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(buildConversation());

      await expect(
        service.send(buildDto({ content: 'hi' }), WORKSPACE_ID, USER_ID, []),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows send when user has respond_conversation permission', async () => {
      const conversation = buildConversation();
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(conversation);

      const hydratedMsg = { id: 'msg-1', status: 'queued' };
      (prisma.message.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });
      (prisma.message.findUniqueOrThrow as jest.Mock).mockResolvedValue(hydratedMsg);
      (prisma.conversation.update as jest.Mock).mockResolvedValue(conversation);

      const result = await service.send(
        buildDto({ content: 'hello' }),
        WORKSPACE_ID,
        USER_ID,
        ['respond_conversation'],
      );

      expect(result).toEqual(hydratedMsg);
    });
  });

  describe('send() — opt-out guard', () => {
    it('throws ForbiddenException when contact has opted out', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ contact: { id: 'c1', phone: '+55', optInStatus: 'opted_out' } }),
      );

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('send() — 24h window', () => {
    it('throws ForbiddenException when 24h window has expired', async () => {
      const expiredTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000);
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ lastContactMessageAt: expiredTimestamp }),
      );

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when lastContactMessageAt is null', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ lastContactMessageAt: null }),
      );

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('send() — conversation lock', () => {
    it('throws ForbiddenException when conversation is assigned to another user', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ assignedUserId: 'other-user' }),
      );

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin (view_all_conversations) to send on conversation assigned to another', async () => {
      const conversation = buildConversation({ assignedUserId: 'other-user' });
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(conversation);

      const hydratedMsg = { id: 'msg-1', status: 'queued' };
      (prisma.message.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });
      (prisma.message.findUniqueOrThrow as jest.Mock).mockResolvedValue(hydratedMsg);
      (prisma.conversation.update as jest.Mock).mockResolvedValue(conversation);

      const result = await service.send(
        buildDto({ content: 'hello' }),
        WORKSPACE_ID,
        USER_ID,
        ['respond_conversation', 'view_all_conversations'],
      );

      expect(result).toEqual(hydratedMsg);
    });
  });

  describe('send() — closed conversation', () => {
    it('throws BadRequestException when conversation is closed', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ status: 'closed' }),
      );

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('send() — collision prevention', () => {
    it('throws ConflictException when another operator is in the conversation (unassigned)', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(
        buildConversation({ assignedUserId: null }),
      );
      (gateway.getActiveOperatorIds as jest.Mock).mockReturnValue(['other-user']);

      await expect(
        service.send(buildDto(), WORKSPACE_ID, USER_ID, ['respond_conversation']),
      ).rejects.toThrow(ConflictException);
    });
  });
});
