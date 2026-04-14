import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ContactLifecycleStage, Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  BulkContactActionDto,
  CreateSavedSegmentDto,
  SetOptInDto,
} from './dto/contact.dto';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';
import { FlowExecutorService } from '../automation/flow-executor.service';

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
    @InjectQueue(CONTACT_IMPORT_QUEUE) private importQueue: Queue,
    private flowExecutor: FlowExecutorService,
  ) {}

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

    return {
      ...contact,
      totalMessageCount: metricsMessages.length,
      responseMetrics: calculateResponseMetrics(metricsMessages),
      conversations: contact.conversations.map((conversation) => ({
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

  // ─── Tags ─────────────────────────────────────────────────────────────────────

  async addTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    const existing = await this.prisma.contactTag.findUnique({
      where: { contactId_tagId: { contactId, tagId } },
    });

    await this.prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId } },
      create: { contactId, tagId },
      update: {},
    });

    if (!existing) {
      await this.flowExecutor.triggerForContactEvent(
        workspaceId,
        contactId,
        'tag_applied',
        tagId,
      );
    }
  }

  async removeTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    await this.prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  }

  // ─── CRUD de Tags do workspace ────────────────────────────────────────────────

  async listTags(workspaceId: string) {
    return this.prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(workspaceId: string, name: string, color?: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    return this.prisma.tag.create({
      data: { workspaceId, name, color: color ?? '#6366f1' },
    });
  }

  async deleteTag(workspaceId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, workspaceId } });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    await this.prisma.tag.delete({ where: { id } });
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

  async applyBulkActions(workspaceId: string, dto: BulkContactActionDto) {
    const contactIds = Array.from(new Set(dto.contactIds));
    const addTagIds = Array.from(new Set(dto.addTagIds ?? []));
    const removeTagIds = Array.from(new Set(dto.removeTagIds ?? []));
    const shouldMoveStage = Boolean(dto.pipelineId || dto.stageId);
    const shouldClearOwner = dto.clearOwner === true;
    const shouldUpdateOwner = shouldClearOwner || dto.ownerId !== undefined;
    const shouldUpdateLifecycle = dto.lifecycleStage !== undefined;
    const hasAction =
      addTagIds.length > 0 ||
      removeTagIds.length > 0 ||
      shouldMoveStage ||
      shouldUpdateOwner ||
      shouldUpdateLifecycle;

    if (!hasAction) {
      throw new BadRequestException('Nenhuma ação em lote foi informada');
    }

    if ((dto.pipelineId && !dto.stageId) || (!dto.pipelineId && dto.stageId)) {
      throw new BadRequestException(
        'Pipeline e stage devem ser enviados juntos para mover contatos',
      );
    }

    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId, id: { in: contactIds } },
      include: {
        contactTags: { select: { tagId: true } },
        contactPipelines: { select: { pipelineId: true, stageId: true } },
      },
    });

    if (contacts.length !== contactIds.length) {
      throw new NotFoundException('Um ou mais contatos não foram encontrados');
    }

    const owner =
      shouldUpdateOwner && !shouldClearOwner
        ? await this.findValidOwner(workspaceId, dto.ownerId)
        : null;

    if (addTagIds.length > 0 || removeTagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: {
          workspaceId,
          id: { in: Array.from(new Set([...addTagIds, ...removeTagIds])) },
        },
        select: { id: true },
      });

      if (tags.length !== new Set([...addTagIds, ...removeTagIds]).size) {
        throw new NotFoundException('Uma ou mais tags não foram encontradas');
      }
    }

    let stage: { id: string; pipelineId: string } | null = null;
    if (shouldMoveStage && dto.pipelineId && dto.stageId) {
      stage = await this.prisma.stage.findFirst({
        where: {
          id: dto.stageId,
          pipelineId: dto.pipelineId,
          pipeline: { workspaceId },
        },
        select: { id: true, pipelineId: true },
      });

      if (!stage) {
        throw new NotFoundException(
          'Stage não encontrado para o pipeline informado',
        );
      }
    }

    const tagInsertRows = addTagIds.flatMap((tagId) =>
      contacts.map((contact) => ({ contactId: contact.id, tagId })),
    );

    const tagPairsToRemove = removeTagIds.flatMap((tagId) =>
      contacts.map((contact) => ({ contactId: contact.id, tagId })),
    );

    const contactsChangingStage =
      stage === null
        ? []
        : contacts.filter((contact) => {
            const current = contact.contactPipelines.find(
              (item) => item.pipelineId === stage.pipelineId,
            );
            return current?.stageId !== stage.id;
          });

    await this.prisma.$transaction(async (tx) => {
      if (shouldUpdateOwner || shouldUpdateLifecycle) {
        const contactData: Prisma.ContactUncheckedUpdateManyInput = {};

        if (shouldUpdateOwner) {
          contactData.ownerId = shouldClearOwner ? null : (owner?.id ?? null);
        }

        if (shouldUpdateLifecycle && dto.lifecycleStage) {
          contactData.lifecycleStage = dto.lifecycleStage;
        }

        await tx.contact.updateMany({
          where: { workspaceId, id: { in: contactIds } },
          data: contactData,
        });
      }

      if (tagInsertRows.length > 0) {
        await tx.contactTag.createMany({
          data: tagInsertRows,
          skipDuplicates: true,
        });
      }

      if (tagPairsToRemove.length > 0) {
        await tx.contactTag.deleteMany({
          where: {
            OR: tagPairsToRemove.map(({ contactId, tagId }) => ({
              contactId,
              tagId,
            })),
          },
        });
      }

      if (stage) {
        for (const contact of contacts) {
          await tx.contactPipeline.upsert({
            where: {
              contactId_pipelineId: {
                contactId: contact.id,
                pipelineId: stage.pipelineId,
              },
            },
            create: {
              contactId: contact.id,
              pipelineId: stage.pipelineId,
              stageId: stage.id,
            },
            update: { stageId: stage.id },
          });
        }
      }
    });

    for (const contact of contacts) {
      const existingTagIds = new Set(
        contact.contactTags.map((item) => item.tagId),
      );
      for (const tagId of addTagIds) {
        if (existingTagIds.has(tagId)) continue;
        await this.flowExecutor.triggerForContactEvent(
          workspaceId,
          contact.id,
          'tag_applied',
          tagId,
        );
      }
    }

    if (stage) {
      for (const contact of contactsChangingStage) {
        await this.flowExecutor.triggerForContactEvent(
          workspaceId,
          contact.id,
          'stage_changed',
          stage.id,
        );
      }
    }

    return {
      updatedContacts: contactIds.length,
      tagsAdded: addTagIds.length * contacts.length,
      tagsRemoved: removeTagIds.length * contacts.length,
      movedToStage: contactsChangingStage.length,
    };
  }

  // ─── Importação CSV ───────────────────────────────────────────────────────────

  async previewImport(workspaceId: string, buffer: Buffer) {
    const rows = this.parseCsv(buffer);

    const candidates: Array<{ phone: string; name?: string; email?: string }> =
      [];
    const invalid: Array<{ row: number; phone: string; reason: string }> = [];

    rows.forEach((row, i) => {
      const phone = row['phone']?.trim() ?? '';
      if (!phone) {
        invalid.push({ row: i + 2, phone: '', reason: 'Telefone obrigatório' });
        return;
      }
      if (!this.isValidE164(phone)) {
        invalid.push({
          row: i + 2,
          phone,
          reason: 'Formato inválido — use E.164 (ex: +5511999999999)',
        });
        return;
      }
      candidates.push({
        phone,
        name: row['name'] || undefined,
        email: row['email'] || undefined,
      });
    });

    // Detectar duplicados no banco
    const phones = candidates.map((c) => c.phone);
    const existing = await this.prisma.contact.findMany({
      where: { workspaceId, phone: { in: phones } },
      select: { phone: true },
    });
    const existingSet = new Set(existing.map((c) => c.phone));

    const duplicates: string[] = [];
    const toCreate = candidates.filter((c) => {
      if (existingSet.has(c.phone)) {
        duplicates.push(c.phone);
        return false;
      }
      return true;
    });

    return { toCreate, duplicates, invalid, totalRows: rows.length };
  }

  async queueImport(
    workspaceId: string,
    rows: Array<{ phone: string; name?: string; email?: string }>,
  ) {
    const job = await this.importQueue.add('import', { workspaceId, rows });
    return { jobId: job.id, count: rows.length };
  }

  async bulkCreate(
    workspaceId: string,
    rows: Array<{ phone: string; name?: string; email?: string }>,
  ) {
    await this.prisma.contact.createMany({
      data: rows.map((r) => ({
        workspaceId,
        phone: r.phone,
        name: r.name ?? null,
        email: r.email ?? null,
        source: 'import_csv',
      })),
      skipDuplicates: true,
    });
  }

  // ─── Helpers CSV ──────────────────────────────────────────────────────────────

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

  private isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
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

  private parseCsv(buffer: Buffer): Array<Record<string, string>> {
    const text = buffer
      .toString('utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = this.splitCsvLine(lines[0], delimiter).map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/^["']|["']$/g, ''),
    );

    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line, delimiter);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (values[i] ?? '').trim().replace(/^["']|["']$/g, '');
      });
      return row;
    });
  }

  // ─── Notas internas ──────────────────────────────────────────────────────────

  async listNotes(workspaceId: string, contactId: string) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contactNote.findMany({
      where: { contactId, workspaceId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNote(
    workspaceId: string,
    contactId: string,
    authorId: string,
    content: string,
  ) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contactNote.create({
      data: { contactId, workspaceId, authorId, content: content.trim() },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async setOptIn(workspaceId: string, contactId: string, dto: SetOptInDto) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        optInStatus: dto.status,
        optInAt: dto.status === 'opted_in' ? new Date() : undefined,
        optInSource: dto.source ?? null,
        optInEvidence: dto.evidence ?? null,
      },
    });
  }

  async deleteNote(workspaceId: string, contactId: string, noteId: string) {
    const note = await this.prisma.contactNote.findFirst({
      where: { id: noteId, contactId, workspaceId },
    });
    if (!note) throw new NotFoundException('Nota não encontrada');
    await this.prisma.contactNote.delete({ where: { id: noteId } });
  }

  private splitCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
