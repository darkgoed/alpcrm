import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
} from './dto/contact.dto';
import { ContactSegmentsService } from './contact-segments.service';

type MetricsMessage = {
  conversationId: string;
  senderType: 'user' | 'contact' | 'system';
  createdAt: Date;
};

type ResponseMetrics = {
  firstResponseMs: number | null;
  averageResponseMs: number | null;
  lastResponseMs: number | null;
  pendingResponseMs: number | null;
  responseCount: number;
};

function calculateResponseMetrics(messages: MetricsMessage[]): ResponseMetrics {
  let pendingContactAt: Date | null = null;
  let firstContactAt: Date | null = null;
  const responseTimes: number[] = [];

  for (const message of messages) {
    if (message.senderType === 'contact') {
      pendingContactAt = message.createdAt;
      firstContactAt ??= message.createdAt;
      continue;
    }

    if (message.senderType === 'user' && pendingContactAt) {
      responseTimes.push(
        message.createdAt.getTime() - pendingContactAt.getTime(),
      );
      pendingContactAt = null;
    }
  }

  return {
    firstResponseMs: responseTimes[0] ?? null,
    averageResponseMs:
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, current) => sum + current, 0) /
              responseTimes.length,
          )
        : null,
    lastResponseMs: responseTimes.at(-1) ?? null,
    pendingResponseMs:
      firstContactAt && pendingContactAt
        ? Date.now() - pendingContactAt.getTime()
        : null,
    responseCount: responseTimes.length,
  };
}

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private segmentsService: ContactSegmentsService,
  ) {}

  // ─── Listar contatos com filtros ─────────────────────────────────────────────

  async findAll(workspaceId: string, filters: ContactFilterDto) {
    const where = this.segmentsService.buildContactWhere(workspaceId, filters);

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        contactTags: { include: { tag: true } },
        contactPipelines: { include: { stage: true, pipeline: true } },
        conversations: {
          where: { status: 'open' },
          select: { id: true, status: true },
          take: 1,
        },
      },
    });
  }

  // ─── Buscar um contato ────────────────────────────────────────────────────────

  async findOne(workspaceId: string, id: string, includeMessages = true) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
      include: {
        owner: { select: { id: true, name: true } },
        contactTags: { include: { tag: true } },
        contactPipelines: { include: { stage: true, pipeline: true } },
        conversations: {
          where: { workspaceId },
          orderBy: { createdAt: 'asc' },
          ...(includeMessages
            ? {
                include: {
                  assignedUser: { select: { id: true, name: true } },
                  team: { select: { id: true, name: true } },
                  messages: { orderBy: { createdAt: 'asc' } },
                },
              }
            : {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
                  closedAt: true,
                  updatedAt: true,
                  lastMessageAt: true,
                  lastContactMessageAt: true,
                  assignedUser: { select: { id: true, name: true } },
                  team: { select: { id: true, name: true } },
                  _count: { select: { messages: true } },
                },
              }),
        },
      },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    if (includeMessages) return contact;

    const metricsMessages = await this.prisma.message.findMany({
      where: {
        conversation: {
          workspaceId,
          contactId: id,
        },
      },
      select: {
        conversationId: true,
        senderType: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const messagesByConversation = new Map<string, MetricsMessage[]>();
    for (const message of metricsMessages) {
      const current = messagesByConversation.get(message.conversationId) ?? [];
      current.push(message);
      messagesByConversation.set(message.conversationId, current);
    }

    const conversationSummaries = contact.conversations as Array<{
      id: string;
      status: string;
      createdAt: Date;
      closedAt: Date | null;
      updatedAt: Date;
      lastMessageAt: Date | null;
      lastContactMessageAt: Date | null;
      assignedUser: { id: string; name: string } | null;
      team: { id: string; name: string } | null;
      _count: { messages: number };
    }>;

    return {
      ...contact,
      totalMessageCount: metricsMessages.length,
      responseMetrics: calculateResponseMetrics(metricsMessages),
      conversations: conversationSummaries.map((conversation) => ({
        ...conversation,
        messageCount: conversation._count.messages,
        responseMetrics: calculateResponseMetrics(
          messagesByConversation.get(conversation.id) ?? [],
        ),
      })),
    };
  }

  // ─── Criar contato ────────────────────────────────────────────────────────────

  async create(workspaceId: string, dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: { workspaceId_phone: { workspaceId, phone: dto.phone } },
    });
    if (existing)
      throw new ConflictException('Contato com esse telefone já existe');

    const { tagIds, ownerId, company, customFields, ...rest } = dto;
    const owner = await this.findValidOwner(workspaceId, ownerId);

    return this.prisma.contact.create({
      data: {
        workspaceId,
        source: 'manual',
        ...rest,
        company: company?.trim() ? company.trim() : null,
        customFields: this.normalizeCustomFields(customFields),
        ownerId: owner?.id ?? null,
        ...(tagIds?.length
          ? { contactTags: { create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: {
        owner: { select: { id: true, name: true } },
        contactTags: { include: { tag: true } },
      },
    });
  }

  // ─── Atualizar contato ────────────────────────────────────────────────────────

  async update(workspaceId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const { ownerId, company, customFields, ...rest } = dto;
    const data: Prisma.ContactUpdateInput = { ...rest };

    if ('company' in dto) {
      data.company = company?.trim() ? company.trim() : null;
    }

    if ('customFields' in dto) {
      data.customFields = this.normalizeCustomFields(customFields);
    }

    if ('ownerId' in dto) {
      const owner = await this.findValidOwner(workspaceId, ownerId);
      data.owner = owner ? { connect: { id: owner.id } } : { disconnect: true };
    }

    return this.prisma.contact.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true } },
        contactTags: { include: { tag: true } },
        contactPipelines: { include: { stage: true, pipeline: true } },
        conversations: {
          where: { status: 'open' },
          select: { id: true, status: true },
          take: 1,
        },
      },
    });
  }

  // ─── Excluir contato ──────────────────────────────────────────────────────────

  async remove(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    await this.prisma.contact.delete({ where: { id } });
  }

  private async findValidOwner(workspaceId: string, ownerId?: string | null) {
    if (!ownerId) return null;

    const owner = await this.prisma.user.findFirst({
      where: { id: ownerId, workspaceId, isActive: true },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException('Owner do contato não encontrado');
    return owner;
  }

  private normalizeCustomFields(
    input?: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    const entries = Object.entries(input ?? {})
      .map(([rawKey, rawValue]) => {
        const key = rawKey.trim().slice(0, 60);
        if (!key) return null;

        if (
          rawValue === null ||
          rawValue === undefined ||
          Array.isArray(rawValue) ||
          typeof rawValue === 'object'
        ) {
          return null;
        }

        if (
          typeof rawValue !== 'string' &&
          typeof rawValue !== 'number' &&
          typeof rawValue !== 'boolean'
        ) {
          return null;
        }

        const value = String(rawValue).trim().slice(0, 500);
        return value ? [key, value] : null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry));

    return Object.fromEntries(entries) as Prisma.InputJsonObject;
  }
}
