import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ContactLifecycleStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  CreateSavedSegmentDto,
} from './dto/contact.dto';

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
  constructor(private prisma: PrismaService) {}

  // ─── Listar contatos com filtros ─────────────────────────────────────────────

  async findAll(workspaceId: string, filters: ContactFilterDto) {
    const where = this.buildContactWhere(workspaceId, filters);

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

  async merge(
    workspaceId: string,
    sourceContactId: string,
    targetContactId: string,
  ) {
    if (sourceContactId === targetContactId) {
      throw new BadRequestException(
        'Selecione contatos diferentes para mesclar',
      );
    }

    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId, id: { in: [sourceContactId, targetContactId] } },
      include: {
        contactTags: { select: { tagId: true } },
        contactPipelines: true,
        flowStates: true,
      },
    });

    const source = contacts.find((contact) => contact.id === sourceContactId);
    const target = contacts.find((contact) => contact.id === targetContactId);

    if (!source || !target) {
      throw new NotFoundException('Contato não encontrado');
    }

    const mergedCustomFields = this.mergeCustomFields(
      source.customFields,
      target.customFields,
    );

    const mergedOptInStatus =
      target.optInStatus !== 'unknown'
        ? target.optInStatus
        : source.optInStatus;
    const mergedOptInAt = target.optInAt ?? source.optInAt;
    const mergedLifecycleStage = this.mergeLifecycleStage(
      source.lifecycleStage,
      target.lifecycleStage,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.contact.update({
        where: { id: target.id },
        data: {
          name: target.name ?? source.name,
          email: target.email ?? source.email,
          company: target.company ?? source.company,
          ownerId: target.ownerId ?? source.ownerId,
          source: target.source === 'manual' ? target.source : source.source,
          lifecycleStage: mergedLifecycleStage,
          optInStatus: mergedOptInStatus,
          optInAt: mergedOptInAt,
          customFields: mergedCustomFields,
        },
      });

      await tx.conversation.updateMany({
        where: { workspaceId, contactId: source.id },
        data: { contactId: target.id },
      });

      for (const tag of source.contactTags) {
        await tx.contactTag.upsert({
          where: {
            contactId_tagId: { contactId: target.id, tagId: tag.tagId },
          },
          create: { contactId: target.id, tagId: tag.tagId },
          update: {},
        });
      }

      for (const pipeline of source.contactPipelines) {
        const existingPipeline = target.contactPipelines.find(
          (item) => item.pipelineId === pipeline.pipelineId,
        );

        if (existingPipeline) continue;

        await tx.contactPipeline.create({
          data: {
            contactId: target.id,
            pipelineId: pipeline.pipelineId,
            stageId: pipeline.stageId,
          },
        });
      }

      for (const flowState of source.flowStates) {
        const existingFlowState = target.flowStates.find(
          (item) => item.flowId === flowState.flowId,
        );

        if (existingFlowState) continue;

        await tx.contactFlowState.create({
          data: {
            contactId: target.id,
            flowId: flowState.flowId,
            currentNodeId: flowState.currentNodeId,
            isActive: flowState.isActive,
          },
        });
      }

      await tx.contact.delete({ where: { id: source.id } });
    });

    return this.findOne(workspaceId, target.id);
  }

  async listSavedSegments(workspaceId: string) {
    return this.prisma.savedSegment.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createSavedSegment(workspaceId: string, dto: CreateSavedSegmentDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Nome da segmentação é obrigatório');
    }

    const filters = this.normalizeSegmentFilters(dto);

    return this.prisma.savedSegment.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
      create: {
        workspaceId,
        name,
        filters,
      },
      update: {
        filters,
      },
    });
  }

  async deleteSavedSegment(workspaceId: string, id: string) {
    const segment = await this.prisma.savedSegment.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });
    if (!segment) throw new NotFoundException('Segmentação não encontrada');
    await this.prisma.savedSegment.delete({ where: { id } });
  }

  private buildContactWhere(
    workspaceId: string,
    filters: ContactFilterDto,
  ): Prisma.ContactWhereInput {
    const and: Prisma.ContactWhereInput[] = [{ workspaceId }];

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    for (const tagId of filters.tagIds ?? []) {
      and.push({ contactTags: { some: { tagId } } });
    }

    if (filters.stageId && filters.pipelineId) {
      and.push({
        contactPipelines: {
          some: { stageId: filters.stageId, pipelineId: filters.pipelineId },
        },
      });
    } else if (filters.stageId) {
      and.push({ contactPipelines: { some: { stageId: filters.stageId } } });
    } else if (filters.pipelineId) {
      and.push({
        contactPipelines: { some: { pipelineId: filters.pipelineId } },
      });
    }

    if (filters.conversationStatus === 'open') {
      and.push({
        conversations: { some: { workspaceId, status: 'open' } },
      });
    } else if (filters.conversationStatus === 'closed') {
      and.push({
        conversations: { some: { workspaceId, status: 'closed' } },
      });
    } else if (filters.conversationStatus === 'none') {
      and.push({
        conversations: { none: { workspaceId } },
      });
    }

    return and.length === 1 ? and[0] : { AND: and };
  }

  private normalizeSegmentFilters(dto: CreateSavedSegmentDto) {
    const filters: Record<string, Prisma.InputJsonValue> = {};

    if (dto.search?.trim()) {
      filters.search = dto.search.trim();
    }

    const tagIds = Array.from(new Set(dto.tagIds ?? [])).filter(Boolean);
    if (tagIds.length > 0) {
      filters.tagIds = tagIds;
    }

    if (dto.pipelineId) {
      filters.pipelineId = dto.pipelineId;
    }

    if (dto.stageId) {
      filters.stageId = dto.stageId;
    }

    if (dto.conversationStatus) {
      filters.conversationStatus = dto.conversationStatus;
    }

    return filters as Prisma.InputJsonObject;
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

  private mergeCustomFields(
    source: Prisma.JsonValue,
    target: Prisma.JsonValue,
  ): Prisma.InputJsonObject {
    const sourceFields = this.asStringRecord(source);
    const targetFields = this.asStringRecord(target);
    return {
      ...sourceFields,
      ...targetFields,
    } as Prisma.InputJsonObject;
  }

  private asStringRecord(value: Prisma.JsonValue): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value).reduce<Record<string, string>>(
      (acc, [key, rawValue]) => {
        if (typeof rawValue !== 'string') return acc;
        acc[key] = rawValue;
        return acc;
      },
      {},
    );
  }

  private mergeLifecycleStage(
    source: ContactLifecycleStage,
    target: ContactLifecycleStage,
  ): ContactLifecycleStage {
    const rank: Record<ContactLifecycleStage, number> = {
      inactive: 0,
      lead: 1,
      qualified: 2,
      customer: 3,
    };

    return rank[target] >= rank[source] ? target : source;
  }

}
