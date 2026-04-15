import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';

const WS1 = 'workspace-1';
const WS2 = 'workspace-2';
const CONV_ID = 'conv-1';
const USER_ID = 'user-1';

function buildConversation(workspaceId = WS1, overrides: Record<string, unknown> = {}) {
  return {
    id: CONV_ID,
    workspaceId,
    status: 'open',
    contactId: 'contact-1',
    assignedUserId: null,
    contact: { id: 'contact-1' },
    whatsappAccount: { id: 'acct-1', phoneNumber: '+55' },
    assignedUser: null,
    team: null,
    ...overrides,
  };
}

describe('ConversationsService — workspace isolation', () => {
  let service: ConversationsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: PrismaService,
          useValue: {
            conversation: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: { emitToWorkspace: jest.fn() },
        },
        {
          provide: WhatsappService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(ConversationsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('findOne() — workspace isolation', () => {
    it('returns conversation when workspaceId matches', async () => {
      const conv = buildConversation(WS1, { assignedUserId: USER_ID });
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(conv);

      const result = await service.findOne(CONV_ID, WS1, USER_ID, []);
      expect(result).toEqual(conv);
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: WS1 }) }),
      );
    });

    it('throws NotFoundException when workspaceId does not match (cross-tenant attempt)', async () => {
      // Prisma returns null when workspaceId filter doesn't match
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(CONV_ID, WS2, USER_ID, [])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assign() — permission guard', () => {
    it('throws ForbiddenException when lacking assign_conversation permission', async () => {
      await expect(
        service.assign(CONV_ID, WS1, { userId: USER_ID }, []),
      ).rejects.toThrow(ForbiddenException);
    });

    it('calls prisma.update when permission is present', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(buildConversation());
      (prisma.conversation.update as jest.Mock).mockResolvedValue({});

      await service.assign(CONV_ID, WS1, { userId: USER_ID }, ['assign_conversation']);
      expect(prisma.conversation.update).toHaveBeenCalled();
    });
  });

  describe('close() — permission guard', () => {
    it('throws ForbiddenException when lacking close_conversation permission', async () => {
      await expect(service.close(CONV_ID, WS1, [])).rejects.toThrow(ForbiddenException);
    });

    it('runs transaction when permission is present', async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(buildConversation());
      (prisma.$transaction as jest.Mock).mockResolvedValue({ status: 'closed' });

      const result = await service.close(CONV_ID, WS1, ['close_conversation']);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
